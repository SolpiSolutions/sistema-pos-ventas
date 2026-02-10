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

export class LoginDto extends createZodDto(LoginSchema) { }