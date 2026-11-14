import { ConfigService } from "@nestjs/config";
import { BankTransferService } from "./bank-transfer.service";
import { VnpayService } from "./vnpay.service";
import { SimulationDto } from "./payments.dto";
import { UserRole } from "@prisma/client";
import {
  Body,
  Get,
  Header,
  ServiceUnavailableException,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CreatePaymentDto } from "./payments.dto";
import { PaymentsService } from "./payments.service";

type AuthedRequest = Request & {
  user: { id: string; email: string; role: UserRole };
};

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private vnpay: VnpayService,
    private bank: BankTransferService,
    private config: ConfigService,
  ) {}

  @Get("methods")
  @Header("Cache-Control", "no-store")
  methods() {
    return {
      available: [
        "LOYALTY_POINTS",
        ...(this.config.get("PAYMENT_MODE") === "simulation"
          ? ["WALLET_SIM", "CARD_SIM"]
          : []),
        ...(this.bank.isConfigured() ? ["BANK_TRANSFER"] : []),
        ...(this.vnpay.isConfigured() ? ["VNPAY"] : []),
      ],
    };
  }

  @Get("bank-transfer/:orderId")
  @Header("Cache-Control", "no-store")
  bankInstructions(@Req() req: AuthedRequest, @Param("orderId") id: string) {
    return this.bank.instructions(req.user.id, id);
  }

  @Post()
  async create(
    @Req() req: AuthedRequest,
    @Headers("idempotency-key") key: string,
    @Body() dto: CreatePaymentDto,
  ) {
    if (dto.method === "BANK_TRANSFER") this.bank.assertConfigured();
    if (dto.method === "MOMO")
      throw new ServiceUnavailableException(
        "MoMo chưa được kích hoạt merchant. Vui lòng chọn phương thức đang hỗ trợ.",
      );
    if (dto.method === "VNPAY") this.vnpay.assertConfigured();
    const payment = await this.payments.create(
      req.user.id,
      key,
      dto,
      req.user.role,
      {
        ipAddress: req.ip,
        userAgent:
          typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"]
            : undefined,
      },
    );
    return dto.method === "VNPAY"
      ? { ...payment, paymentUrl: this.vnpay.url(payment, req.ip) }
      : payment;
  }

  @Post(":id/simulate")
  simulate(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: SimulationDto,
  ) {
    return this.vnpay.simulate(req.user.id, id, dto.outcome);
  }

  @Post(":orderId/confirm")
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  confirm(@Req() req: AuthedRequest, @Param("orderId") orderId: string) {
    return this.payments.confirm(orderId, req.user.id, req.user.role, {
      ipAddress: req.ip,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : undefined,
    });
  }
}
