import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from './../db/schema';
import { DRIZZLE } from 'src/db/db.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AjusteStockDto, CreateInsumoDto, UpdateInsumoDto } from './dto/insumo.dto';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class InventarioService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async findAll() {
        return await this.db.query.insumos.findMany({
            orderBy: (insumos, { asc }) => [asc(insumos.nombre)],
        });
    }

    async create(createInsumoDto: CreateInsumoDto) {
        const [nuevoInsumo] = await this.db
            .insert(schema.insumos)
            .values({
                ...createInsumoDto,
                stockActual: createInsumoDto.stockActual?.toString(),
                stockMinimo: createInsumoDto.stockMinimo?.toString(),
                costoUnitario: createInsumoDto.costoUnitario?.toString(),
            })
            .returning();
        return nuevoInsumo;
    }

    async update(id: string, updateInsumoDto: UpdateInsumoDto) {
        const [insumoActualizado] = await this.db
            .update(schema.insumos)
            .set({
                ...(updateInsumoDto.nombre !== undefined && { nombre: updateInsumoDto.nombre }),
                ...(updateInsumoDto.unidadMedida !== undefined && { unidadMedida: updateInsumoDto.unidadMedida }),
                ...(updateInsumoDto.tipo !== undefined && { tipo: updateInsumoDto.tipo }),
                ...(updateInsumoDto.stockActual !== undefined && { stockActual: updateInsumoDto.stockActual.toString() }),
                ...(updateInsumoDto.stockMinimo !== undefined && { stockMinimo: updateInsumoDto.stockMinimo.toString() }),
                ...(updateInsumoDto.costoUnitario !== undefined && { costoUnitario: updateInsumoDto.costoUnitario.toString() }),
            })
            .where(eq(schema.insumos.id, id))
            .returning();

        if (!insumoActualizado) throw new NotFoundException('Insumo no encontrado');
        return insumoActualizado;
    }

    // MÉTODO CRÍTICO: Ajuste de stock con auditoría
    async ajustarStock(id: string, ajusteDto: AjusteStockDto, usuarioId: string) {
        return await this.db.transaction(async (tx) => {
            // 1. Verificar existencia
            const [insumo] = await tx
                .select()
                .from(schema.insumos)
                .where(eq(schema.insumos.id, id));

            if (!insumo) throw new NotFoundException('Insumo no encontrado');

            // 2. Actualizar el stock actual
            const nuevoStock = Number(insumo.stockActual) + ajusteDto.cantidad;

            await tx
                .update(schema.insumos)
                .set({ stockActual: nuevoStock.toString() })
                .where(eq(schema.insumos.id, id));

            // 3. Registrar el movimiento
            await tx.insert(schema.movimientosInventario).values({
                insumoId: id,
                usuarioId: usuarioId,
                cantidad: ajusteDto.cantidad.toString(),
                tipo: ajusteDto.cantidad > 0 ? 'COMPRA' : 'AJUSTE',
                motivo: ajusteDto.motivo,
            });

            return { message: 'Stock actualizado correctamente', nuevoStock };
        });
    }

    async registrarEntrada(dto: { insumoId: string, cantidad: number, motivo?: string }, usuarioId: string) {
        return await this.db.transaction(async (tx) => {
            const [insumoActualizado] = await tx
                .update(schema.insumos)
                .set({
                    stockActual: sql`${schema.insumos.stockActual} + ${dto.cantidad}`,
                })
                .where(eq(schema.insumos.id, dto.insumoId))
                .returning();

            if (!insumoActualizado) throw new NotFoundException('Insumo no encontrado');
            await tx.insert(schema.movimientosInventario).values({
                insumoId: dto.insumoId,
                usuarioId: usuarioId,
                cantidad: dto.cantidad.toString(),
                tipo: 'COMPRA',
                motivo: dto.motivo || 'Ingreso de mercadería manual',
            });

            return insumoActualizado;
        });
    }
}