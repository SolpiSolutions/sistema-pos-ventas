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

export class ProcesarVentaDto extends createZodDto(ProcesarVentaSchema) { }