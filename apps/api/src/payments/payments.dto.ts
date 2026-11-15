import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @MaxLength(100)
  orderId: string;

  @IsIn(['LOYALTY_POINTS', 'BANK_TRANSFER'])
  method: 'LOYALTY_POINTS' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'WALLET_SIM' | 'CARD_SIM';
}
export class SimulationDto {
  @IsIn(['success', 'failure'])
  outcome: 'success' | 'failure';
}
