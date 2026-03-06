CREATE TYPE "public"."tipo_insumo" AS ENUM('BASE', 'PREPARADO');--> statement-breakpoint
ALTER TABLE "ingredientes" RENAME TO "insumos";--> statement-breakpoint
ALTER TABLE "movimientos_inventario" RENAME COLUMN "ingrediente_id" TO "insumo_id";--> statement-breakpoint
ALTER TABLE "recetas" RENAME COLUMN "ingrediente_id" TO "insumo_id";--> statement-breakpoint
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_ingrediente_id_ingredientes_id_fk";
--> statement-breakpoint
ALTER TABLE "recetas" DROP CONSTRAINT "recetas_ingrediente_id_ingredientes_id_fk";
--> statement-breakpoint
ALTER TABLE "insumos" ADD COLUMN "tipo" "tipo_insumo" DEFAULT 'BASE';--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE no action ON UPDATE no action;