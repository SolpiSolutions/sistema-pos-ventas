import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as schema from './../db/schema';
import { compare } from 'bcrypt';
import { DRIZZLE } from 'src/db/db.provider';
import { JwtService } from '@nestjs/jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { LoginDto } from './dto/login.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
        private readonly jwtService: JwtService,
    ) { }

    async login(credentials: LoginDto) {
        let user;
        if (credentials.userId) {
            [user] = await this.db.select()
                .from(schema.usuarios)
                .where(and(eq(schema.usuarios.id, credentials.userId), eq(schema.usuarios.activo, true)));
        } else {
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

        const payload = { sub: user.id, nombre: user.nombre, rol: user.rol };

        const { passwordHash, pinHash, ...userClean } = user;

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: userClean,
        };
    }

    async getCajeros() {
        return await this.db
            .select({
                id: schema.usuarios.id,
                nombre: schema.usuarios.nombre
            })
            .from(schema.usuarios)
            .where(
                and(
                    eq(schema.usuarios.rol, 'CAJERO'),
                    eq(schema.usuarios.activo, true) // SOlo los activos
                )
            );
    }
}