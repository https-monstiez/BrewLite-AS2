import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
@Injectable()
export class BankTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private settings() {
    const bankBin = this.config.get<string>("BANK_BIN") || "";
    const accountNumber = this.config.get<string>("BANK_ACCOUNT_NUMBER") || "";
    const accountName = this.config.get<string>("BANK_ACCOUNT_NAME") || "";
    if (
      !/^\d{6}$/.test(bankBin) ||
      !/^[a-zA-Z0-9]{1,19}$/.test(accountNumber) ||
      !accountName.trim() ||
      accountName.length > 100
    )
      throw new ServiceUnavailableException(
        "Chuyển khoản ngân hàng chưa được cấu hình.",
      );
    return {
      bankBin,
      accountNumber,
      accountName: accountName.trim(),
      bankName:
        this.config.get<string>("BANK_NAME") ||
        (bankBin === "970436" ? "Vietcombank" : "Ngân hàng nhận"),
    };
  }
  isConfigured() {
    try {
      this.settings();
      return true;
    } catch {
      return false;
    }
  }
  assertConfigured() {
    this.settings();
  }
  async instructions(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        method: "BANK_TRANSFER",
        status: "PENDING",
        order: { userId, status: "PENDING" },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!payment)
      throw new NotFoundException(
        "Không tìm thấy đơn chuyển khoản đang chờ thanh toán của bạn.",
      );
    const bank = this.settings();
    if (
      !Number.isSafeInteger(payment.amount) ||
      payment.amount <= 0 ||
      payment.amount > 9999999999999
    )
      throw new BadRequestException(
        "Số tiền không hợp lệ để tạo mã chuyển khoản.",
      );
    const transferContent = payment.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    if (!transferContent || transferContent.length > 50)
      throw new BadRequestException("Mã tham chiếu thanh toán không hợp lệ.");
    const query = new URLSearchParams({
      amount: String(payment.amount),
      addInfo: transferContent,
      accountName: bank.accountName,
    });
    return {
      ...bank,
      orderId,
      paymentId: payment.id,
      amount: payment.amount,
      transferContent,
      qrImageUrl: `https://img.vietqr.io/image/${bank.bankBin}-${bank.accountNumber}-compact2.svg?${query}`,
      confirmation: "STAFF_RECONCILIATION" as const,
    };
  }
}
