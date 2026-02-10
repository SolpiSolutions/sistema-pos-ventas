import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from './../db/schema';
import { DRIZZLE } from 'src/db/db.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AbrirCajaDto, CerrarCajaDto } from './dto/sesion-caja.dto';
import { and, eq, sql } from 'drizzle-orm';
import { ProcesarVentaDto } from './dto/venta.dto';

interface DetalleTemporal {
    productoId: string;
    cantidad: number;
    precioUnitario: string;
    subtotal: string;
    recetas: any[];
    nombreProducto: string;
}

@Injectable()
export class VentasService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async abrirCaja(usuarioId: string, dto: AbrirCajaDto) {
        const cajaActiva = await this.db.query.sesionesCaja.findFirst({
            where: and(
                eq(schema.sesionesCaja.usuarioId, usuarioId),
                eq(schema.sesionesCaja.estado, 'ABIERTA')
            )
        });

        if (cajaActiva) {
            throw new BadRequestException('Ya tienes una sesión de caja abierta');
        }

        const [nuevaSesion] = await this.db
            .insert(schema.sesionesCaja)
            .values({
                usuarioId,
                montoApertura: dto.montoApertura.toString(),
                estado: 'ABIERTA',
                openedAt: new Date(),
            })
            .returning();
        return nuevaSesion;
    }

    async cerrarCaja(usuarioId: string, dto: CerrarCajaDto) {
        const resumen = await this.obtenerResumenSesion(usuarioId);
        const diferenciaCalculada = dto.montoCierre - resumen.montoEsperadoEfectivo;

        // Generamos una nota automática si no se envió una manual
        let notaFinal = dto.observaciones || "Cierre de turno normal";
        if (diferenciaCalculada !== 0) {
            notaFinal = `[ALERTA] Diferencia de ${diferenciaCalculada} Bs detectada. ${notaFinal}`;
        }

        const [sesionCerrada] = await this.db
            .update(schema.sesionesCaja)
            .set({
                montoCierre: dto.montoCierre.toString(),
                diferencia: diferenciaCalculada.toString(),
                estado: 'CERRADA',
                closedAt: new Date(),
                notas: notaFinal // Usamos la columna existente
            })
            .where(eq(schema.sesionesCaja.id, resumen.sesionId))
            .returning();

        return {
            mensaje: 'Caja cerrada exitosamente',
            resultado: diferenciaCalculada === 0 ? "CUADRE PERFECTO" : (diferenciaCalculada > 0 ? "SOBRANTE" : "FALTANTE"),
            analisis: {
                efectivoContado: dto.montoCierre,
                efectivoEsperado: resumen.montoEsperadoEfectivo,
                diferencia: diferenciaCalculada,
            },
            cierre: sesionCerrada
        };
    }

    async getSesionActiva(usuarioId: string) {
        return await this.db.query.sesionesCaja.findFirst({
            where: and(
                eq(schema.sesionesCaja.usuarioId, usuarioId),
                eq(schema.sesionesCaja.estado, 'ABIERTA')
            ),
        });
    }

    async procesarVenta(usuarioId: string, dto: ProcesarVentaDto) {
        return await this.db.transaction(async (tx) => {

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const ventasHoy = await tx.select({ count: sql<number>`count(*)` })
                .from(schema.ventas)
                .where(sql`${schema.ventas.createdAt} >= ${hoy}`);

            const numeroTicket = (Number(ventasHoy[0].count) + 1).toString().padStart(4, '0');

            const sesion = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(schema.sesionesCaja.usuarioId, usuarioId),
                    eq(schema.sesionesCaja.estado, 'ABIERTA')
                ),
            });

            if (!sesion) throw new BadRequestException('Debes abrir caja antes de vender')

            let montoTotalAcumulado = 0;
            const detallesParaInsertar: DetalleTemporal[] = [];

            for (const item of dto.detalles) {
                const producto = await tx.query.productos.findFirst({
                    where: eq(schema.productos.id, item.productoId),
                    with: { recetas: true },
                });

                if (!producto) throw new NotFoundException(`Producto ${item.productoId} no existe`);

                const precioReal = Number(producto.precio);
                const subtotalCalculado = precioReal * item.cantidad;
                montoTotalAcumulado += subtotalCalculado;

                detallesParaInsertar.push({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: precioReal.toString(),
                    subtotal: subtotalCalculado.toString(),
                    recetas: producto.recetas || [],
                    nombreProducto: producto.nombre
                });
            }

            const [nuevaVenta] = await tx
                .insert(schema.ventas)
                .values({
                    usuarioId,
                    sesionCajaId: sesion.id,
                    montoTotal: montoTotalAcumulado.toString(),
                    metodoPago: dto.metodoPago,
                    estado: 'COMPLETADA',
                    numeroTicket: numeroTicket
                })
                .returning();

            for (const det of detallesParaInsertar) {
                // Insertar detalle de venta
                await tx.insert(schema.detallesVenta).values({
                    ventaId: nuevaVenta.id,
                    productoId: det.productoId,
                    cantidad: det.cantidad,
                    precioUnitario: det.precioUnitario,
                    subtotal: det.subtotal,
                });

                // Procesar receta e inventario
                if (det.recetas.length > 0) {
                    for (const r of det.recetas) {
                        if (!r.insumoId) continue;

                        const cantidadADescontar = Number(r.cantidadRequerida) * det.cantidad;

                        // Actualización atómica de stock
                        await tx
                            .update(schema.insumos)
                            .set({
                                stockActual: sql`${schema.insumos.stockActual} - ${cantidadADescontar}`,
                            })
                            .where(eq(schema.insumos.id, r.insumoId));

                        // Registro de movimiento
                        await tx.insert(schema.movimientosInventario).values({
                            insumoId: r.insumoId,
                            usuarioId,
                            ventaId: nuevaVenta.id,
                            cantidad: (-cantidadADescontar).toString(),
                            tipo: 'VENTA_CONSUMO',
                            motivo: `Ticket ${numeroTicket} - ${det.nombreProducto}`,
                        });
                    }
                }
            }

            return { ...nuevaVenta, ticket: numeroTicket };
        });
    }

    async anularVenta(usuarioId: string, ventaId: string) {
        return await this.db.transaction(async (tx) => {
            const venta = await tx.query.ventas.findFirst({
                where: eq(schema.ventas.id, ventaId),
                with: {
                    detalles: {
                        with: {
                            producto: {
                                with: { recetas: true }
                            }
                        }
                    }
                }
            });

            if (!venta) throw new NotFoundException('La venta no existe');
            if (venta.estado === 'ANULADA') throw new BadRequestException('Esta venta ya fue anulada');

            for (const detalle of venta.detalles) {
                const recetas = detalle.producto?.recetas || [];

                for (const r of recetas) {
                    if (!r.insumoId) continue;

                    const cantidadADevolver = Number(r.cantidadRequerida) * detalle.cantidad;

                    await tx.update(schema.insumos)
                        .set({
                            stockActual: sql`${schema.insumos.stockActual} + ${cantidadADevolver}`,
                        })
                        .where(eq(schema.insumos.id, r.insumoId));

                    await tx.insert(schema.movimientosInventario).values({
                        insumoId: r.insumoId,
                        usuarioId,
                        ventaId: venta.id,
                        cantidad: cantidadADevolver.toString(),
                        tipo: 'AJUSTE',
                        motivo: `ANULACIÓN TICKET ${venta.numeroTicket} - ${detalle.producto?.nombre}`,
                    });
                }
            }

            // Cambiar el estado de la venta
            const [ventaAnulada] = await tx.update(schema.ventas)
                .set({ estado: 'ANULADA' })
                .where(eq(schema.ventas.id, ventaId))
                .returning();

            return ventaAnulada;
        });
    }

    async obtenerResumenSesion(usuarioId: string) {
        const sesion = await this.db.query.sesionesCaja.findFirst({
            where: and(
                eq(schema.sesionesCaja.usuarioId, usuarioId),
                eq(schema.sesionesCaja.estado, 'ABIERTA')
            ),
        });

        if (!sesion) throw new NotFoundException('No hay una sesión de caja abierta');

        // Obtenemos todas las ventas de esta sesión
        const ventas = await this.db.query.ventas.findMany({
            where: eq(schema.ventas.sesionCajaId, sesion.id),
        });

        // Procesamos los totales con un solo recorrido (reduce)
        const resumen = ventas.reduce((acc, v) => {
            const monto = parseFloat(v.montoTotal) || 0;

            if (v.estado === 'COMPLETADA') {
                acc.totalVentas += monto;
                acc.cantidadVentas += 1;

                if (v.metodoPago === 'EFECTIVO') acc.totalEfectivo += monto;
                if (v.metodoPago === 'TARJETA') acc.totalTarjeta += monto;
                if (v.metodoPago === 'QR') acc.totalQR += monto;
            } else if (v.estado === 'ANULADA') {
                acc.totalAnulado += monto;
                acc.cantidadAnulaciones += 1;
            }

            return acc;
        }, {
            totalVentas: 0,
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalQR: 0,
            totalAnulado: 0,
            cantidadVentas: 0,
            cantidadAnulaciones: 0
        });

        const montoApertura = Number(sesion.montoApertura) || 0;
        const montoEsperadoEfectivo = montoApertura + resumen.totalEfectivo;

        return {
            sesionId: sesion.id,
            fechaApertura: sesion.openedAt,
            montoApertura,
            ...resumen,
            montoEsperadoEfectivo,
            totalVentasElectronicas: resumen.totalTarjeta + resumen.totalQR
        };
    }
}