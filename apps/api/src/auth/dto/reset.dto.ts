import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ResetPasswordSchema = z.object({
    email: z.email().describe('Correo electrónico registrado'),
    code: z.string().length(6).describe('Código de 6 dígitos enviado por email'),
    newPassword: z.string().min(8).describe('Nueva contraseña'),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {
    @ApiProperty({ example: 'admin@restaurante.com' })
    email: string;

    @ApiProperty({ example: '123456' })
    code: string;

    @ApiProperty({ example: 'nuevaContraseña123' })
    newPassword: string;
}
