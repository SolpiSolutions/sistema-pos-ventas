import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const InsumoSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(255),
    unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
    stockActual: z.number().min(0).default(0),
    stockMinimo: z.number().min(0).default(0),
    costoUnitario: z.number().min(0).default(0),
    tipo: z.enum(['BASE', 'PREPARADO']).default('BASE'),
});

export class CreateInsumoDto extends createZodDto(InsumoSchema) { }

export class UpdateInsumoDto extends createZodDto(InsumoSchema.partial()) { }

export const AjusteStockSchema = z.object({
    cantidad: z.number(),
    motivo: z.string().min(5, 'Debes dar un motivo válido para el ajuste.'),
});

export class AjusteStockDto extends createZodDto(AjusteStockSchema) { }