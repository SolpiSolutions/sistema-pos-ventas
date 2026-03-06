import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from './../db/schema';
import { DRIZZLE } from 'src/db/db.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportesService {
    constructor(
        @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    ) { }

    async obtenerDashboardPrincipal() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        // 1. Estadísticas Generales y Ticket Promedio
        const stats = await this.db
            .select({
                totalVendido: sql<number>`COALESCE(sum(${schema.ventas.montoTotal}::numeric), 0)`,
                cantidadVentas: sql<number>`count(${schema.ventas.id})`,
                ticketPromedio: sql<number>`COALESCE(avg(${schema.ventas.montoTotal}::numeric), 0)`,
            })
            .from(schema.ventas)
            .where(and(eq(schema.ventas.estado, 'COMPLETADA'), gte(schema.ventas.createdAt, hoy)));

        // 2. Ventas por Método de Pago (Gráfico de Pastel)
        const porMetodoPago = await this.db
            .select({
                metodo: schema.ventas.metodoPago,
                total: sql<number>`sum(${schema.ventas.montoTotal}::numeric)`,
                cantidad: sql<number>`count(*)`,
            })
            .from(schema.ventas)
            .where(and(eq(schema.ventas.estado, 'COMPLETADA'), gte(schema.ventas.createdAt, hoy)))
            .groupBy(schema.ventas.metodoPago);

        // 3. Top 5 Productos (Gráfico de Barras)
        const topProductos = await this.db
            .select({
                nombre: schema.productos.nombre,
                // Usamos sql<number> para asegurar que el resultado sea numérico
                cantidad: sql<number>`CAST(sum(${schema.detallesVenta.cantidad}) AS INTEGER)`,
                ingresos: sql<number>`sum(${schema.detallesVenta.subtotal}::numeric)`,
            })
            .from(schema.detallesVenta)
            .innerJoin(
                schema.productos,
                eq(schema.detallesVenta.productoId, schema.productos.id)
            )
            .groupBy(schema.productos.nombre)
            // IMPORTANTE: Ordenamos por la misma función de agregación, no por el alias
            .orderBy(desc(sql`sum(${schema.detallesVenta.cantidad})`))
            .limit(5);
        // 4. Alertas de Inventario
        const alertasStock = await this.db.query.insumos.findMany({
            where: sql`${schema.insumos.stockActual} <= 10`, // Umbral configurable
            limit: 10
        });

        // 5. Histórico de 7 días (Gráfico de Líneas)
        const graficoSemanas = await this.db
            .select({
                fecha: sql<string>`TO_CHAR(${schema.ventas.createdAt}, 'YYYY-MM-DD')`,
                total: sql<number>`sum(${schema.ventas.montoTotal}::numeric)`,
            })
            .from(schema.ventas)
            .where(and(eq(schema.ventas.estado, 'COMPLETADA'), gte(schema.ventas.createdAt, sql`CURRENT_DATE - INTERVAL '7 days'`)))
            .groupBy(sql`1`)
            .orderBy(sql`1`);

        return {
            resumenHoy: stats[0],
            metodosPago: porMetodoPago,
            topProductos,
            alertasStock,
            graficoSemanas,
            mesActual: await this.db.select({ total: sql`sum(${schema.ventas.montoTotal}::numeric)` })
                .from(schema.ventas)
                .where(and(eq(schema.ventas.estado, 'COMPLETADA'), gte(schema.ventas.createdAt, inicioMes)))
        };
    }

    async generarCSVVentas() {
        const ventas = await this.db.query.ventas.findMany({
            with: { usuario: true },
            orderBy: [desc(schema.ventas.createdAt)],
            limit: 100
        });

        const encabezados = "Ticket;Fecha;Cajero;Metodo;Monto;Estado\n";
        const filas = ventas.map(v =>
            `${v.numeroTicket};${v.createdAt?.toLocaleString()};${v.usuario?.nombre || 'N/A'};${v.metodoPago};${v.montoTotal};${v.estado}`
        ).join('\n');

        return encabezados + filas;
    }

    // async generarPDFTicket(ventaId: string) {
    //     const venta = await this.db.query.ventas.findFirst({
    //         where: eq(schema.ventas.id, ventaId),
    //         with: {
    //             detalles: { with: { producto: true } },
    //             usuario: true
    //         }
    //     });

    //     if (!venta) throw new NotFoundException('Venta no encontrada');

    //     const doc = new PDFDocument({ size: [226, 600], margin: 10 }); // Tamaño típico de ticket térmico

    //     // Diseño del Ticket
    //     doc.fontSize(12).text('VAQUITA POS', { align: 'center' });
    //     doc.fontSize(8).text('Santa Cruz - Bolivia', { align: 'center' });
    //     doc.moveDown();
    //     doc.text(`Ticket: ${venta.numeroTicket}`);
    //     doc.text(`Fecha: ${venta.createdAt?.toLocaleString()}`);
    //     doc.text(`Cajero: ${venta.usuario?.nombre}`);
    //     doc.text('------------------------------------------');

    //     venta.detalles.forEach(d => {
    //         doc.text(`${d.producto?.nombre} x${d.cantidad}`);
    //         doc.text(`${d.subtotal} Bs`, { align: 'right' });
    //     });

    //     doc.text('------------------------------------------');
    //     doc.fontSize(10).text(`TOTAL: ${venta.montoTotal} Bs`, { align: 'right', bold: true });
    //     doc.moveDown();
    //     doc.fontSize(8).text('¡Gracias por su compra!', { align: 'center' });

    //     doc.end();
    //     return doc;
    // }
}