CREATE TABLE "Ingredient" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "unit" TEXT NOT NULL, "stock" INTEGER NOT NULL DEFAULT 0 CHECK ("stock" >= 0));
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");
CREATE TABLE "RecipeIngredient" ("productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE, "ingredientId" TEXT NOT NULL REFERENCES "Ingredient"("id") ON DELETE RESTRICT, "quantity" INTEGER NOT NULL CHECK ("quantity" > 0), PRIMARY KEY ("productId", "ingredientId"));
CREATE TABLE "IngredientReservation" ("orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE, "ingredientId" TEXT NOT NULL REFERENCES "Ingredient"("id") ON DELETE RESTRICT, "quantity" INTEGER NOT NULL, "restored" BOOLEAN NOT NULL DEFAULT false, PRIMARY KEY ("orderId", "ingredientId"));
CREATE TABLE "StockMovement" ("id" TEXT NOT NULL PRIMARY KEY, "ingredientId" TEXT NOT NULL REFERENCES "Ingredient"("id") ON DELETE RESTRICT, "quantity" INTEGER NOT NULL, "reason" TEXT NOT NULL, "reference" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "StockMovement_reference_key" ON "StockMovement"("reference");
