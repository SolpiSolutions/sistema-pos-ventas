import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { VentasService } from "./ventas.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AbrirCajaDto, CerrarCajaDto } from "./dto/sesion-caja.dto";
import { ProcesarVentaDto } from "./dto/venta.dto";
import * as schema from './../db/schema';
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "src/db/db.provider";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller('ventas')
@ApiTags('Ventas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly ventasService: VentasService
  ) { }

  @Get('sesion-activa')
  @ApiOperation({ summary: 'Obtener sesión de caja activa' })
  @ApiResponse({ status: 200, description: 'Estado de la sesión actual' })
  async verEstado(@Req() req: any) {
    const sesion = await this.ventasService.getSesionActiva(req.user.userId);
    return sesion || { estado: 'SIN_SESION' };
  }

  @Post('abrir-caja')
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Abrir sesión de caja', description: 'Inicia una nueva sesión de caja. Administradores o Cajeros' })
  @ApiBody({ type: AbrirCajaDto })
  @ApiResponse({ status: 201, description: 'Sesión abierta exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async abrir(@Body() dto: AbrirCajaDto, @Req() req: any) {
    return this.ventasService.abrirCaja(req.user.userId, dto);
  }

  @Post('cerrar-caja')
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Cerrar sesión de caja', description: 'Cierra la sesión de caja actual. Administradores o Cajeros' })
  @ApiBody({ type: CerrarCajaDto })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 400, description: 'No hay sesión abierta' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async cerrar(@Body() dto: CerrarCajaDto, @Req() req: any) {
    return this.ventasService.cerrarCaja(req.user.userId, dto);
  }

  @Get('resumen-cierre')
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Obtener resumen de cierre de sesión', description: 'Muestra el resumen de movimientos de la sesión actual' })
  @ApiResponse({ status: 200, description: 'Resumen de sesión' })
  async resumen(@Req() req: any) {
    return this.ventasService.obtenerResumenSesion(req.user.userId);
  }

  @Post('procesar')
  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Procesar venta', description: 'Registra una nueva venta. Administradores o Cajeros' })
  @ApiBody({ type: ProcesarVentaDto })
  @ApiResponse({ status: 201, description: 'Venta procesada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o sesión no abierta' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async vender(@Body() dto: ProcesarVentaDto, @Req() req: any) {
    return this.ventasService.procesarVenta(req.user.userId, dto);
  }

  @Patch(':id/anular')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Anular venta', description: 'Revierte una venta ya procesada. Solo administradores' })
  @ApiParam({ name: 'id', description: 'ID de la venta a anular' })
  @ApiResponse({ status: 200, description: 'Venta anulada exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async anular(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.ventasService.anularVenta(req.user.userId, id);
  }
}