import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import * as schema from './../db/schema';
import { AuthService } from "./auth.service";
import { DRIZZLE } from "src/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { LoginDto } from "./dto/login.dto";
import { eq } from "drizzle-orm";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>
    ) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('cajeros')
    async getCajeros() {
        return await this.authService.getCajeros();
    }
}