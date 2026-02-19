import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as schema from './../db/schema';
import { compare, hash } from 'bcrypt';
import { DRIZZLE } from './../db/db.provider';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './../common/mail/mail.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { LoginDto } from './dto/login.dto';
import { and, eq } from 'drizzle-orm';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) { }

    async login(credentials: LoginDto) {
        let user;
        if (credentials.userId) {
            [user] = await this.db.select()
                .from(schema.usuarios)
                .where(and(eq(schema.usuarios.id, credentials.userId), eq(schema.usuarios.activo, true)));
        } else if (credentials.email) {
            [user] = await this.db.select()
                .from(schema.usuarios)
                .where(and(eq(schema.usuarios.email, credentials.email!), eq(schema.usuarios.activo, true)));
        }

        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        let isMatch = false;
        if (credentials.pin && user.pinHash) {
            isMatch = await compare(credentials.pin, user.pinHash);
        } else if (credentials.password && user.passwordHash) {
            isMatch = await compare(credentials.password, user.passwordHash);
        }

        if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

        const payload = { sub: user.id, nombre: user.nombre, rol: user.rol, esMaestro: user.esMaestro };

        const { passwordHash, pinHash, ...userClean } = user;

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: userClean,
        };
    }

    async forgotPassword(email: string) {
        const [user] = await this.db.select().from(schema.usuarios)
            .where(and(eq(schema.usuarios.email, email), eq(schema.usuarios.rol, 'ADMINISTRADOR')));

        if (!user) throw new UnauthorizedException('Proceso iniciado si el correo existe');

        // Generar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = addMinutes(new Date(), 15); // Expira en 15 min

        await this.db.update(schema.usuarios)
            .set({ resetCode: code, resetExpires: expires })
            .where(eq(schema.usuarios.id, user.id));

        await this.mailService.sendResetCode(email, code);
        return { message: 'Código enviado al correo' };
    }

    async resetPassword(email: string, code: string, newPassword: string) {
        const [user] = await this.db.select().from(schema.usuarios)
            .where(and(eq(schema.usuarios.email, email), eq(schema.usuarios.resetCode, code)));

        if (!user || !user.resetExpires || new Date() > user.resetExpires) {
            throw new BadRequestException('Código inválido o expirado');
        }

        const hashedPass = await hash(newPassword, 12);

        await this.db.update(schema.usuarios)
            .set({
                passwordHash: hashedPass,
                resetCode: null,
                resetExpires: null
            })
            .where(eq(schema.usuarios.id, user.id));

        return { message: 'Contraseña actualizada correctamente' };
    }
}