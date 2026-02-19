import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ForgotPasswordDto } from "./dto/forgot.dto";
import { ResetPasswordDto } from "./dto/reset.dto";

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

    @Post('forgot-password')
    @ApiOperation({ summary: 'Solicitar código de recuperación', description: 'Envía un código por correo para restablecer contraseña (solo administradores)' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'Código enviado si el correo existe' })
    async forgot(@Body() body: ForgotPasswordDto) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Restablecer contraseña', description: 'Usa el código enviado por correo para establecer una nueva contraseña' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente' })
    async reset(@Body() body: ResetPasswordDto) {
        return this.authService.resetPassword(body.email, body.code, body.newPassword);
    }
}