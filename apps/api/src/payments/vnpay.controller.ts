import { Controller, Get, Query } from "@nestjs/common";
import { VnpayService } from "./vnpay.service";
@Controller("payments/vnpay")
export class VnpayController {
  constructor(private readonly vnpay: VnpayService) {}
  @Get("ipn") ipn(@Query() query: Record<string, unknown>) {
    return this.vnpay.callback(query);
  }
  @Get("return") result(@Query() query: Record<string, unknown>) {
    return this.vnpay.callback(query);
  }
}
