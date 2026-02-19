import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AbrirCajaSchema = z.object({
  montoApertura: z.coerce.number().min(0, 'El monto debe ser positivo'),
});

export const CerrarCajaSchema = z.object({
  montoCierre: z.coerce.number().min(0, 'El monto de cierre debe ser positivo'),
  observaciones: z.string().optional(),
});

export class AbrirCajaDto extends createZodDto(AbrirCajaSchema) {
  @ApiProperty({ description: 'Monto inicial para abrir la caja', example: 100, type: Number })
  montoApertura: number;
}
export class CerrarCajaDto extends createZodDto(CerrarCajaSchema) {
  @ApiProperty({ description: 'Monto final al cerrar la caja', example: 250, type: Number })
  montoCierre: number;

  @ApiProperty({ description: 'Observaciones sobre el cierre', example: 'Todo en orden', required: false })
  observaciones?: string;
}