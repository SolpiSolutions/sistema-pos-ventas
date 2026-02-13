import {
    pgTable,
    uuid,
    text,
    varchar,
    integer,
    boolean,
    timestamp,
    decimal,
    pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- ENUMS ---
export const rolUsuarioEnum = pgEnum('rol_usuario', ['ADMINISTRADOR', 'CAJERO']);
export const estadoSesionEnum = pgEnum('estado_sesion', ['ABIERTA', 'CERRADA']);
export const estadoVentaEnum = pgEnum('estado_venta', ['COMPLETADA', 'ANULADA']);
export const metodoPagoEnum = pgEnum('metodo_pago', ['EFECTIVO', 'TARJETA', 'QR']);
export const tipoInsumoEnum = pgEnum('tipo_insumo', ['BASE', 'PREPARADO']);
export const tipoMovimientoEnum = pgEnum('tipo_movimiento', [
    'COMPRA',
    'VENTA_CONSUMO',
    'MERMA',
    'AJUSTE'
]);

// --- TABLAS ---

export const configuracionNegocio = pgTable('configuracion_negocio', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    rucNit: varchar('ruc_nit', { length: 50 }),
    moneda: varchar('moneda', { length: 10 }).default('Bs'),
    logoUrl: text('logo_url'),
    pieTicket: text('pie_ticket'),
});

export const usuarios = pgTable('usuarios', {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: text('password_hash'),
    pinHash: text('pin_hash'),
    rol: rolUsuarioEnum('rol').notNull().default('CAJERO'),
    activo: boolean('activo').default(true),
    esMaestro: boolean('es_maestro').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const sesionesCaja = pgTable('sesiones_caja', {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id').references(() => usuarios.id),
    montoApertura: decimal('monto_apertura', { precision: 12, scale: 2 }).notNull(),
    montoCierre: decimal('monto_cierre', { precision: 12, scale: 2 }),
    estado: estadoSesionEnum('estado').default('ABIERTA'),
    notas: text('notas'),
    openedAt: timestamp('opened_at').defaultNow(),
    closedAt: timestamp('closed_at'),
    diferencia: decimal('diferencia', { precision: 12, scale: 2 }).default('0.0'),
});

export const categorias = pgTable('categorias', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', { length: 100 }).unique().notNull(),
});

export const insumos = pgTable('insumos', {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    unidadMedida: varchar('unidad_medida', { length: 50 }).notNull(),
    stockActual: decimal('stock_actual', { precision: 12, scale: 2 }).default('0'),
    stockMinimo: decimal('stock_minimo', { precision: 12, scale: 2 }).default('0'),
    costoUnitario: decimal('costo_unitario', { precision: 12, scale: 2 }).default('0'),
    tipo: tipoInsumoEnum('tipo').default('BASE'),
});

export const productos = pgTable('productos', {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    precio: decimal('precio', { precision: 12, scale: 2 }).notNull(),
    costoProduccion: decimal('costo_produccion', { precision: 12, scale: 2 }).default('0'),
    categoriaId: integer('categoria_id').references(() => categorias.id),
    imagenUrl: text('imagen_url'),
    estado: boolean('esta_activo').default(true),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const recetas = pgTable('recetas', {
    id: uuid('id').primaryKey().defaultRandom(),
    productoId: uuid('producto_id').references(() => productos.id, { onDelete: 'cascade' }),
    insumoId: uuid('insumo_id').references(() => insumos.id),
    cantidadRequerida: decimal('cantidad_requerida', { precision: 12, scale: 2 }).notNull(),
});

export const ventas = pgTable('ventas', {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id').references(() => usuarios.id),
    sesionCajaId: uuid('sesion_caja_id').references(() => sesionesCaja.id),
    numeroTicket: varchar('numero_ticket', { length: 50 }).unique(),
    montoTotal: decimal('monto_total', { precision: 12, scale: 2 }).notNull(),
    metodoPago: metodoPagoEnum('metodo_pago').notNull(),
    estado: estadoVentaEnum('estado').default('COMPLETADA'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const detallesVenta = pgTable('detalles_venta', {
    id: uuid('id').primaryKey().defaultRandom(),
    ventaId: uuid('venta_id').references(() => ventas.id, { onDelete: 'cascade' }),
    productoId: uuid('producto_id').references(() => productos.id),
    cantidad: integer('cantidad').notNull(),
    precioUnitario: decimal('precio_unitario', { precision: 12, scale: 2 }).notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const movimientosInventario = pgTable('movimientos_inventario', {
    id: uuid('id').primaryKey().defaultRandom(),
    insumoId: uuid('insumo_id').references(() => insumos.id),
    usuarioId: uuid('usuario_id').references(() => usuarios.id),
    ventaId: uuid('venta_id').references(() => ventas.id),
    cantidad: decimal('cantidad', { precision: 12, scale: 2 }).notNull(),
    tipo: tipoMovimientoEnum('tipo').notNull(),
    motivo: text('motivo'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const usuariosRelations = relations(usuarios, ({ many }) => ({
    ventas: many(ventas),
    sesiones: many(sesionesCaja),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
    categoria: one(categorias, {
        fields: [productos.categoriaId],
        references: [categorias.id],
    }),
    recetas: many(recetas),
    detallesVenta: many(detallesVenta),
}));

export const insumosRelations = relations(insumos, ({ many }) => ({
    recetas: many(recetas),
    movimientos: many(movimientosInventario),
}));

export const recetasRelations = relations(recetas, ({ one }) => ({
    producto: one(productos, {
        fields: [recetas.productoId],
        references: [productos.id],
    }),
    insumo: one(insumos, {
        fields: [recetas.insumoId],
        references: [insumos.id],
    }),
}));

export const ventasRelations = relations(ventas, ({ one, many }) => ({
    usuario: one(usuarios, {
        fields: [ventas.usuarioId],
        references: [usuarios.id],
    }),
    sesionCaja: one(sesionesCaja, {
        fields: [ventas.sesionCajaId],
        references: [sesionesCaja.id],
    }),
    detalles: many(detallesVenta),
}));

export const detallesVentaRelations = relations(detallesVenta, ({ one }) => ({
    venta: one(ventas, {
        fields: [detallesVenta.ventaId],
        references: [ventas.id],
    }),
    producto: one(productos, {
        fields: [detallesVenta.productoId],
        references: [productos.id],
    }),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
    productos: many(productos),
}));

export const sesionesCajaRelations = relations(sesionesCaja, ({ one, many }) => ({
    usuario: one(usuarios, {
        fields: [sesionesCaja.usuarioId],
        references: [usuarios.id],
    }),
    ventas: many(ventas),
}));

export const movimientosInventarioRelations = relations(movimientosInventario, ({ one }) => ({
    insumo: one(insumos, {
        fields: [movimientosInventario.insumoId],
        references: [insumos.id],
    }),
    usuario: one(usuarios, {
        fields: [movimientosInventario.usuarioId],
        references: [usuarios.id],
    }),
    venta: one(ventas, {
        fields: [movimientosInventario.ventaId],
        references: [ventas.id],
    }),
}));