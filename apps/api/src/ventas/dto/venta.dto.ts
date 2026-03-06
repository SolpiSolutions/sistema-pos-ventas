import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DetalleVentaSchema = z.object({
    productoId: z.uuid(),
    cantidad: z.number().int().positive()
});

export const ProcesarVentaSchema = z.object({
    metodoPago: z.enum(['EFECTIVO', 'TARJETA', 'QR']),
    detalles: z.array(DetalleVentaSchema).min(1, 'La venta debe tener al menos un producto'),
});

export class ProcesarVentaDto extends createZodDto(ProcesarVentaSchema) {
    @ApiProperty({
        description: 'Método de pago',
        example: 'EFECTIVO',
        enum: ['EFECTIVO', 'TARJETA', 'QR']
    })
    metodoPago: 'EFECTIVO' | 'TARJETA' | 'QR';

    @ApiProperty({
        description: 'Detalles de los productos vendidos',
        example: [
            { productoId: '550e8400-e29b-41d4-a716-446655440000', cantidad: 2 },
            { productoId: '550e8400-e29b-41d4-a716-446655440001', cantidad: 1 }
        ],
        type: 'array',
        items: {
            type: 'object',
            properties: {
                productoId: { type: 'string', format: 'uuid' },
                cantidad: { type: 'number' }
            }
        }
    })
    detalles: Array<{ productoId: string; cantidad: number }>;
}