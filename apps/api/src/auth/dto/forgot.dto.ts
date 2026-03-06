import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ForgotPasswordSchema = z.object({
    email: z.email().describe('Correo electrónico registrado'),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {
    @ApiProperty({ example: 'admin@restaurante.com', description: 'Email registrado' })
    email: string;
}