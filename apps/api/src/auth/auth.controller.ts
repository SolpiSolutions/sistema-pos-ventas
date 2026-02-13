import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica un usuario y devuelve un token JWT' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Sesión iniciada correctamente' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('cajeros')
    @ApiOperation({ summary: 'Obtener lista de cajeros', description: 'Retorna todos los usuarios con rol de cajero' })
    @ApiResponse({ status: 200, description: 'Lista de cajeros obtenida' })
    async getCajeros() {
        return await this.authService.getCajeros();
    }
}