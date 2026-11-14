import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { InventoryService } from "./inventory.service";
class IngredientDto {
  @IsString() @MaxLength(100) name: string;
  @IsIn(["g", "ml", "piece"]) unit: string;
}
class ReceiveDto {
  @IsInt() @Min(1) @Max(100000000) quantity: number;
  @IsString() @MaxLength(200) reference: string;
}
class RecipeLineDto {
  @IsString() ingredientId: string;
  @IsInt() @Min(1) @Max(1000000) quantity: number;
}
class RecipeDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  items: RecipeLineDto[];
}
@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get() list() {
    return this.inventory.list();
  }
  @Post() create(@Body() dto: IngredientDto) {
    return this.inventory.create(dto);
  }
  @Post(":id/receive") receive(
    @Param("id") id: string,
    @Body() dto: ReceiveDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.inventory.receive(id, dto.quantity, dto.reference, req.user.id);
  }
  @Put("recipes/:productId") recipe(
    @Param("productId") productId: string,
    @Body() dto: RecipeDto,
  ) {
    return this.inventory.recipe(productId, dto.items);
  }
}
