import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateUserSchema = z.object({
    nombre: z.string().min(2).max(50).trim().describe('Nombre completo del usuario'),
    rol: z.enum(['ADMINISTRADOR', 'CAJERO']).default('CAJERO').describe('Rol del usuario'),
    // Email y Password obligatorios si es ADMIN
    email: z.email().optional().nullable().describe('Correo electrónico (solo administradores)'),
    password: z.string().min(8).optional().nullable().describe('Contraseña (solo administradores)'),
    // PIN obligatorio si es CAJERO (4 a 6 dígitos)
    pin: z.string().regex(/^\d{4,6}$/, "El PIN debe tener entre 4 y 6 números").optional().nullable().describe('PIN numérico para cajeros'),
}).refine(data => {
    if (data.rol === 'ADMINISTRADOR') return !!data.email && !!data.password;
    if (data.rol === 'CAJERO') return !!data.pin;
    return true;
}, { message: "Faltan credenciales obligatorias para el rol seleccionado" });

export class CreateUserDto extends createZodDto(CreateUserSchema) {
    @ApiProperty({
        description: 'Nombre completo del usuario',
        minLength: 2,
        maxLength: 50,
        example: 'Juan Pérez',
    })
    nombre: string;

    @ApiProperty({
        description: 'Rol del usuario',
        enum: ['ADMINISTRADOR', 'CAJERO'],
        default: 'CAJERO',
        example: 'CAJERO',
    })
    rol: 'ADMINISTRADOR' | 'CAJERO';

    @ApiPropertyOptional({
        description: 'Correo electrónico (solo administradores)',
        format: 'email',
        example: 'admin@example.com',
    })
    email?: string | null;

    @ApiPropertyOptional({
        description: 'Contraseña (solo administradores)',
        minLength: 8,
        example: 's3guraP4ss',
    })
    password?: string | null;

    @ApiPropertyOptional({
        description: 'PIN numérico para cajeros (4-6 dígitos)',
        pattern: '^\\d{4,6}$',
        example: '1234',
    })
    pin?: string | null;
}