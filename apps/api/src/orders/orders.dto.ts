
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderLineDto {
  @IsString()
  @MaxLength(100)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  qty: number;

  @IsOptional()
  @IsString()
  @IsIn(['S', 'M', 'L'])
  size?: string;

  @IsOptional()
  @IsIn(['0', '30', '50', '70', '100'])
  sugar?: string;

  @IsOptional()
  @IsIn(['0', '50', '100'])
  ice?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsIn(['Trân châu', 'Kem cheese', 'Thạch cà phê'], { each: true })
  toppings?: string[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  promotionCode?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class RequestCancellationDto extends CancelOrderDto {}

export class ReviewCancellationDto {
  @IsBoolean()
  approved: boolean;
}
