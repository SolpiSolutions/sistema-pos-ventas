import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ConfigService } from "@nestjs/config";
import * as schema from '../db/schema';
import { DRIZZLE } from 'src/db/db.provider';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from "./dto/user.dto";
import { and, eq } from "drizzle-orm";

@Injectable()
export class UserService {
    private readonly saltRounds = 12;

    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
        private readonly configService: ConfigService,
    ) { }

    async create(data: CreateUserDto) {
        const masterEmail = this.configService.get<string>('MASTER_EMAIL');

        if (data.email) {
            const [existing] = await this.db
                .select()
                .from(schema.usuarios)
                .where(eq(schema.usuarios.email, data.email));
            if (existing) throw new ConflictException('El email ya está registrado');
        }

        const passwordHash = data.password ? await bcrypt.hash(data.password, this.saltRounds) : null;
        const pinHash = data.pin ? await bcrypt.hash(data.pin, this.saltRounds) : null;

        const esMaestro = data.email === masterEmail;

        const [newUser] = await this.db
            .insert(schema.usuarios)
            .values({
                nombre: data.nombre,
                email: data.email,
                passwordHash,
                pinHash,
                rol: data.rol,
                esMaestro: esMaestro,
                activo: true,
            })
            .returning();

        const { passwordHash: _, pinHash: __, ...result } = newUser;
        return result;
    }

    async updateCredentials(userId: string, data: { password?: string; pin?: string }) {
        const updateData: any = {};

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 12);
        }

        if (data.pin) {
            updateData.pinHash = await bcrypt.hash(data.pin, 12);
        }

        await this.db.update(schema.usuarios)
            .set(updateData)
            .where(eq(schema.usuarios.id, userId));

        return { message: 'Credenciales actualizadas' };
    }

    async updateCajero(id: string, data: { nombre?: string; pin?: string }) {
        const updateData: any = {};
        if (data.nombre) updateData.nombre = data.nombre;
        if (data.pin) {
            updateData.pinHash = await bcrypt.hash(data.pin, this.saltRounds);
        }

        const [updated] = await this.db
            .update(schema.usuarios)
            .set(updateData)
            .where(and(
                eq(schema.usuarios.id, id),
                eq(schema.usuarios.rol, 'CAJERO'),
                eq(schema.usuarios.activo, true)
            ))
            .returning();

        if (!updated) throw new NotFoundException('Cajero no encontrado o no activo');

        const { passwordHash, pinHash, ...result } = updated;
        return result;
    }

    async findAllCajeros() {
        return await this.db
            .select({
                id: schema.usuarios.id,
                nombre: schema.usuarios.nombre,
            })
            .from(schema.usuarios)
            .where(and(eq(schema.usuarios.rol, 'CAJERO'), eq(schema.usuarios.activo, true)));
    }

    async remove(idToDelete: string) {
        const [user] = await this.db
            .select()
            .from(schema.usuarios)
            .where(eq(schema.usuarios.id, idToDelete));

        if (!user) throw new NotFoundException('Usuario no encontrado');

        // Protección contra eliminación del usuario maestro
        if (user.esMaestro) {
            throw new ForbiddenException('No se puede eliminar al usuario administrador maestro');
        }

        const [deletedUser] = await this.db
            .update(schema.usuarios)
            .set({ activo: false })
            .where(eq(schema.usuarios.id, idToDelete))
            .returning();

        return { message: `Usuario ${deletedUser.nombre} desactivado correctamente` };
    }
}