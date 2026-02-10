CREATE TYPE "public"."estado_sesion" AS ENUM('ABIERTA', 'CERRADA');--> statement-breakpoint
CREATE TYPE "public"."estado_venta" AS ENUM('COMPLETADA', 'ANULADA');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('EFECTIVO', 'TARJETA', 'QR');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('ADMINISTRADOR', 'CAJERO');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('COMPRA', 'VENTA_CONSUMO', 'MERMA', 'AJUSTE');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categorias_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "categorias_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "configuracion_negocio" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "configuracion_negocio_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(255) NOT NULL,
	"ruc_nit" varchar(50),
	"moneda" varchar(10) DEFAULT 'Bs',
	"logo_url" text,
	"pie_ticket" text
);
--> statement-breakpoint
CREATE TABLE "detalles_venta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venta_id" uuid,
	"producto_id" uuid,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"unidad_medida" varchar(50) NOT NULL,
	"stock_actual" numeric(12, 2) DEFAULT '0',
	"stock_minimo" numeric(12, 2) DEFAULT '0',
	"costo_unitario" numeric(12, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "movimientos_inventario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingrediente_id" uuid,
	"usuario_id" uuid,
	"venta_id" uuid,
	"cantidad" numeric(12, 2) NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"motivo" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"precio" numeric(12, 2) NOT NULL,
	"costo_produccion" numeric(12, 2) DEFAULT '0',
	"categoria_id" integer,
	"imagen_url" text,
	"esta_activo" boolean DEFAULT true,
	"actualizado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_id" uuid,
	"ingrediente_id" uuid,
	"cantidad_requerida" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesiones_caja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"monto_apertura" numeric(12, 2) NOT NULL,
	"monto_cierre" numeric(12, 2),
	"estado" "estado_sesion" DEFAULT 'ABIERTA',
	"notas" text,
	"opened_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"email" varchar(255),
	"password_hash" text,
	"pin_hash" text,
	"rol" "rol_usuario" DEFAULT 'CAJERO' NOT NULL,
	"activo" boolean DEFAULT true,
	"es_maestro" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"sesion_caja_id" uuid,
	"numero_ticket" varchar(50),
	"monto_total" numeric(12, 2) NOT NULL,
	"metodo_pago" "metodo_pago" NOT NULL,
	"estado" "estado_venta" DEFAULT 'COMPLETADA',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ventas_numero_ticket_unique" UNIQUE("numero_ticket")
);
--> statement-breakpoint
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_ingrediente_id_ingredientes_id_fk" FOREIGN KEY ("ingrediente_id") REFERENCES "public"."ingredientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_ingrediente_id_ingredientes_id_fk" FOREIGN KEY ("ingrediente_id") REFERENCES "public"."ingredientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sesion_caja_id_sesiones_caja_id_fk" FOREIGN KEY ("sesion_caja_id") REFERENCES "public"."sesiones_caja"("id") ON DELETE no action ON UPDATE no action;