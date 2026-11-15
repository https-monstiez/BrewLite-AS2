
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { BankTransferService } from "./bank-transfer.service";
import { JwtStrategy } from "../auth/jwt.strategy";
import { RolesGuard } from "../common/roles.guard";

@Module({
  imports: [PassportModule],
  controllers: [PaymentsController],
  providers: [
    BankTransferService,
    PaymentsService,
    JwtStrategy,
    RolesGuard,
  ],
})
export class PaymentsModule {}
