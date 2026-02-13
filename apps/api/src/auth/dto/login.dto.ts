import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.email().optional(),
    password: z.string().optional(),
    userId: z.uuid().optional(),
    pin: z.string().optional(),
}).refine(data => {
    const isAdmin = data.email && data.password;
    const isCajero = data.userId && data.pin;
    return isAdmin || isCajero;
}, {
    message: "Debe proprcionar credenciales válidas"
});

export class LoginDto extends createZodDto(LoginSchema) {
    /** @example admin@restaurante.com */
    @ApiProperty({ description: 'Email del administrador', example: 'admin@restaurante.com', required: false })
    email?: string;

    /** @example contraseña123 */
    @ApiProperty({ description: 'Contraseña del administrador', example: 'contraseña123', required: false })
    password?: string;

    /** @example 550e8400-e29b-41d4-a716-446655440000 */
    @ApiProperty({ description: 'ID del usuario (cajero)', example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    userId?: string;

    /** @example 1234 */
    @ApiProperty({ description: 'PIN del cajero', example: '1234', required: false })
    pin?: string;
}