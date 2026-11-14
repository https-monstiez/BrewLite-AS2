import { restoreIngredients } from "../inventory/inventory-reservations";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { SPENDING_PER_POINT } from "../common/loyalty.constants";

export function canonical(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
}
export function signature(
  params: Record<string, string>,
  secret: string,
): string {
  return createHmac("sha512", secret).update(canonical(params)).digest("hex");
}
function vnpDate(date: Date): string {
  return new Date(date.getTime() + 7 * 3600000)
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);
}
@Injectable()
export class VnpayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private settings() {
    const code = this.config.get<string>("VNPAY_TMN_CODE");
    const secret = this.config.get<string>("VNPAY_HASH_SECRET");
    const returnUrl = this.config.get<string>("VNPAY_RETURN_URL");
    if (!code || !secret || !returnUrl)
      throw new ServiceUnavailableException(
        "VNPay chưa được cấu hình. Hãy chọn thanh toán mô phỏng.",
      );
    return { code, secret, returnUrl };
  }
  isConfigured() { try { this.settings(); return true; } catch { return false; } }
  assertConfigured() {
    this.settings();
  }
  url(payment: { id: string; amount: number }, ip = "127.0.0.1") {
    const { code, secret, returnUrl } = this.settings();
    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: code,
      vnp_Amount: String(payment.amount * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: payment.id,
      vnp_OrderInfo: `Thanh toan BrewLite ${payment.id}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ip.replace("::ffff:", ""),
      vnp_CreateDate: vnpDate(new Date()),
      vnp_ExpireDate: vnpDate(new Date(Date.now() + 15 * 60000)),
    };
    return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${canonical(params)}&vnp_SecureHash=${signature(params, secret)}`;
  }
  async callback(query: Record<string, unknown>) {
    const { code, secret } = this.settings();
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (
        !key.startsWith("vnp_") ||
        key === "vnp_SecureHash" ||
        key === "vnp_SecureHashType"
      )
        continue;
      if (typeof value !== "string")
        return { RspCode: "97", Message: "Invalid signature" };
      params[key] = value;
    }
    const supplied = query.vnp_SecureHash;
    if (
      typeof supplied !== "string" ||
      !/^[a-f0-9]{128}$/i.test(supplied) ||
      !timingSafeEqual(
        Buffer.from(supplied, "hex"),
        Buffer.from(signature(params, secret), "hex"),
      ) ||
      params.vnp_TmnCode !== code
    ) {
      return { RspCode: "97", Message: "Invalid signature" };
    }
    const payment = await this.prisma.payment.findUnique({
      where: { id: params.vnp_TxnRef },
    });
    if (!payment || payment.method !== "VNPAY")
      return { RspCode: "01", Message: "Order not found" };
    if (
      !/^\d+$/.test(params.vnp_Amount ?? "") ||
      Number(params.vnp_Amount) !== payment.amount * 100
    )
      return { RspCode: "04", Message: "Invalid amount" };
    const success =
      params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    const changed = await this.settle(
      payment.id,
      success,
      params.vnp_TransactionNo,
    );
    return {
      RspCode: changed ? "00" : "02",
      Message: changed ? "Confirm Success" : "Already confirmed",
      orderId: payment.orderId,
    };
  }
  async simulate(
    userId: string,
    paymentId: string,
    outcome: "success" | "failure",
  ) {
    if (this.config.get("PAYMENT_MODE") !== "simulation")
      throw new BadRequestException("Thanh toán mô phỏng đang tắt");
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, order: { userId } },
    });
    if (!payment) throw new NotFoundException("Không tìm thấy thanh toán");
    if (!["WALLET_SIM", "CARD_SIM"].includes(payment.method))
      throw new BadRequestException("Chỉ mô phỏng giao dịch Ví/Thẻ thử nghiệm");
    await this.settle(payment.id, outcome === "success", `SIM-${payment.id}`);
    return this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  }
  async settle(
    paymentId: string,
    success: boolean,
    providerRef?: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment || payment.status !== "PENDING") return false;
      // Claim order first: cancel/return/IPN compete on the same row lock.
      const points = success
        ? Math.floor(payment.amount / SPENDING_PER_POINT)
        : 0;
      const order = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: {
          status: success ? "PAID" : "PAYMENT_FAILED",
          loyaltyPointsEarned: points,
          inventoryRestored: !success,
        },
      });
      if (order.count !== 1) return false;
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: success ? "SUCCEEDED" : "FAILED", providerRef },
      });
      if (claimed.count !== 1)
        throw new ConflictException("Thanh toán đã được xử lý");
      if (points > 0) {
        await tx.user.update({
          where: { id: payment.order.userId },
          data: { loyaltyPoints: { increment: points } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: payment.order.userId,
            orderId: payment.orderId,
            points,
            kind: "EARN",
            reference: `earn:${payment.orderId}`,
          },
        });
      }
      if (!success) {
        await restoreIngredients(tx, payment.orderId);
        const items = await tx.orderItem.findMany({
          where: { orderId: payment.orderId },
        });
        for (const item of items)
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty }, version: { increment: 1 } },
          });
        if (payment.order.promotionCode)
          await tx.promotion.updateMany({
            where: { code: payment.order.promotionCode, usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          });
      }
      await tx.activityLog.create({
        data: {
          actorUserId: payment.order.userId,
          action: success ? "PAYMENT_SUCCEEDED" : "PAYMENT_FAILED",
          entity: "PAYMENT",
          entityId: payment.id,
          description: `${payment.method}: ${success ? "success" : "failure"}`,
        },
      });
      return true;
    });
  }
}
