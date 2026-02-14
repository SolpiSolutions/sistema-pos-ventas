import { Controller, Post, Get, Body, UseGuards, Delete, ParseUUIDPipe, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@Controller('usuarios')
@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Crear usuario', description: 'Crear administrador o cajero' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'Usuario creado' })
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get('cajeros')
    async listCajeros() {
        // Endpoint público para el selector del Login
        return this.userService.findAllCajeros();
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Desactivar usuario', description: 'Marca un usuario como inactivo (solo administradores)' })
    @ApiResponse({ status: 200, description: 'Usuario desactivado' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.remove(id);
    }

    @Patch('cajeros/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Actualizar cajero', description: 'Actualizar nombre o PIN de un cajero' })
    @ApiBody({ schema: { type: 'object', properties: { nombre: { type: 'string' }, pin: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Cajero actualizado' })
    async updateCajero(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { nombre?: string; pin?: string }
    ) {
        return this.userService.updateCajero(id, body);
    }
}