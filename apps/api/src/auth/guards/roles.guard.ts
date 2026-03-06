import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { rolUsuarioEnum } from "src/db/schema";
import { number } from "zod";

export type UserRoles = (typeof rolUsuarioEnum.enumValues)[number];

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.get<UserRoles[]>('roles', context.getHandler());
        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!user || !requiredRoles.includes(user.rol)) {
            throw new ForbiddenException('No tienes permisos para realizar esta acción');
        }

        return true;
    }
}