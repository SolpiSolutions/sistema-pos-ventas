import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AbrirCajaSchema = z.object({
    montoApertura: z.coerce.number().min(0, 'El monto debe ser positivo'),
});

export const CerrarCajaSchema = z.object({
  montoCierre: z.coerce.number().min(0, 'El monto de cierre debe ser positivo'),
  observaciones: z.string().optional(),
});

export class AbrirCajaDto extends createZodDto(AbrirCajaSchema) { }
export class CerrarCajaDto extends createZodDto(CerrarCajaSchema) { }