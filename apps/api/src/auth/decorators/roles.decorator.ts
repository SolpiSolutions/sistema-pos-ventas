import { SetMetadata } from "@nestjs/common";
import { rolUsuarioEnum } from "src/db/schema";

export type UserRole = (typeof rolUsuarioEnum.enumValues)[number];

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);