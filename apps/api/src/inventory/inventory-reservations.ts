import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
export async function reserveIngredients(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: { productId: string; qty: number; size: string }[],
) {
  const recipes = await tx.recipeIngredient.findMany({
    where: { productId: { in: items.map((i) => i.productId) } },
  });
  const totals = new Map<string, number>();
  for (const item of items)
    for (const line of recipes.filter((r) => r.productId === item.productId)) {
      const amount =
        Math.ceil(
          line.quantity *
            (item.size === "L" ? 1.5 : item.size === "M" ? 1.25 : 1),
        ) * item.qty;
      totals.set(
        line.ingredientId,
        (totals.get(line.ingredientId) ?? 0) + amount,
      );
    }
  for (const [ingredientId, quantity] of [...totals].sort()) {
    const claimed = await tx.ingredient.updateMany({
      where: { id: ingredientId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (claimed.count !== 1)
      throw new BadRequestException(
        "Không đủ nguyên liệu để pha món. Vui lòng chọn món khác.",
      );
    await tx.ingredientReservation.create({
      data: { orderId, ingredientId, quantity },
    });
    await tx.stockMovement.create({
      data: {
        ingredientId,
        quantity: -quantity,
        reason: "ORDER_RESERVE",
        reference: `reserve:${orderId}:${ingredientId}`,
      },
    });
  }
}
export async function restoreIngredients(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const reservations = await tx.ingredientReservation.findMany({
    where: { orderId, restored: false },
  });
  for (const row of reservations) {
    const changed = await tx.ingredientReservation.updateMany({
      where: { orderId, ingredientId: row.ingredientId, restored: false },
      data: { restored: true },
    });
    if (changed.count !== 1) continue;
    await tx.ingredient.update({
      where: { id: row.ingredientId },
      data: { stock: { increment: row.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        ingredientId: row.ingredientId,
        quantity: row.quantity,
        reason: "ORDER_RESTORE",
        reference: `restore:${orderId}:${row.ingredientId}`,
      },
    });
  }
}
