import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const InsumoSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(255),
    unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
    stockActual: z.number().min(0).default(0),
    stockMinimo: z.number().min(0).default(0),
    costoUnitario: z.number().min(0).default(0),
    tipo: z.enum(['BASE', 'PREPARADO']).default('BASE'),
});

export class CreateInsumoDto extends createZodDto(InsumoSchema) {
    @ApiProperty({ description: 'Nombre del insumo', example: 'Café en grano' })
    nombre: string;

    @ApiProperty({ description: 'Unidad de medida', example: 'kg' })
    unidadMedida: string;

    @ApiProperty({ description: 'Stock actual disponible', example: 10, type: Number })
    stockActual: number;

    @ApiProperty({ description: 'Stock mínimo para alertas', example: 2, type: Number })
    stockMinimo: number;

    @ApiProperty({ description: 'Costo unitario', example: 15.50, type: Number })
    costoUnitario: number;

    @ApiProperty({ description: 'Tipo de insumo', example: 'BASE', enum: ['BASE', 'PREPARADO'] })
    tipo: 'BASE' | 'PREPARADO';
}

export class UpdateInsumoDto extends createZodDto(InsumoSchema.partial()) {
    @ApiProperty({ description: 'Nombre del insumo', example: 'Café en grano', required: false })
    nombre?: string;

    @ApiProperty({ description: 'Unidad de medida', example: 'kg', required: false })
    unidadMedida?: string;

    @ApiProperty({ description: 'Stock actual disponible', example: 10, type: Number, required: false })
    stockActual?: number;

    @ApiProperty({ description: 'Stock mínimo para alertas', example: 2, type: Number, required: false })
    stockMinimo?: number;

    @ApiProperty({ description: 'Costo unitario', example: 15.50, type: Number, required: false })
    costoUnitario?: number;

    @ApiProperty({ description: 'Tipo de insumo', example: 'BASE', enum: ['BASE', 'PREPARADO'], required: false })
    tipo?: 'BASE' | 'PREPARADO';
}

export const AjusteStockSchema = z.object({
    cantidad: z.number(),
    motivo: z.string().min(5, 'Debes dar un motivo válido para el ajuste.'),
});

export class AjusteStockDto extends createZodDto(AjusteStockSchema) {
    @ApiProperty({ description: 'Cantidad a ajustar (puede ser negativa)', example: 5, type: Number })
    cantidad: number;

    @ApiProperty({ description: 'Motivo del ajuste', example: 'Corrección de inventario físico' })
    motivo: string;
}