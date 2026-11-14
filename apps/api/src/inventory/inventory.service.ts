import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      include: {
        recipe: { include: { product: { select: { id: true, name: true } } } },
        movements: { take: 20, orderBy: { createdAt: "desc" } },
      },
    });
  }
  create(data: { name: string; unit: string }) {
    if (!data.name.trim())
      throw new BadRequestException("Tên nguyên liệu không được trống");
    return this.prisma.ingredient.create({
      data: { ...data, name: data.name.trim() },
    });
  }
  async receive(
    id: string,
    quantity: number,
    reference: string,
    actorId: string,
  ) {
    if (!reference.trim())
      throw new BadRequestException("Mã phiếu nhập bắt buộc");
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Ingredient" WHERE "id" = ${id} FOR UPDATE`;
      const ingredient = await tx.ingredient.findUnique({ where: { id } });
      if (!ingredient)
        throw new NotFoundException("Không tìm thấy nguyên liệu");
      const ref = `receipt:${id}:${reference.trim()}`;
      const existing = await tx.stockMovement.findUnique({
        where: { reference: ref },
      });
      if (existing) {
        if (existing.quantity !== quantity)
          throw new BadRequestException("Phiếu nhập đã dùng với số lượng khác");
        return ingredient;
      }
      await tx.stockMovement.create({
        data: { ingredientId: id, quantity, reference: ref, reason: "RECEIPT" },
      });
      await tx.activityLog.create({
        data: {
          actorUserId: actorId,
          actorRole: "ADMIN",
          action: "INVENTORY_RECEIVED",
          entity: "INGREDIENT",
          entityId: id,
          description: `Nhập ${quantity} ${ingredient.unit}, phiếu ${reference}`,
        },
      });
      return tx.ingredient.update({
        where: { id },
        data: { stock: { increment: quantity } },
      });
    });
  }
  async recipe(
    productId: string,
    items: { ingredientId: string; quantity: number }[],
  ) {
    if (new Set(items.map((i) => i.ingredientId)).size !== items.length)
      throw new BadRequestException("Nguyên liệu bị trùng");
    return this.prisma.$transaction(async (tx) => {
      if (!(await tx.product.findUnique({ where: { id: productId } })))
        throw new NotFoundException("Không tìm thấy món");
      if (
        (await tx.ingredient.count({
          where: { id: { in: items.map((i) => i.ingredientId) } },
        })) !== items.length
      )
        throw new BadRequestException("Nguyên liệu không hợp lệ");
      await tx.recipeIngredient.deleteMany({ where: { productId } });
      await tx.recipeIngredient.createMany({
        data: items.map((i) => ({ ...i, productId })),
      });
      return tx.recipeIngredient.findMany({ where: { productId } });
    });
  }
}
