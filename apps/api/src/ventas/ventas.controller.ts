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

@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly ventasService: VentasService
  ) { }

  @Get('sesion-activa')
  async verEstado(@Req() req: any) {
    const sesion = await this.ventasService.getSesionActiva(req.user.userId);
    return sesion || { estado: 'SIN_SESION' };
  }

  @Post('abrir-caja')
  @Roles('ADMINISTRADOR', 'CAJERO')
  async abrir(@Body() dto: AbrirCajaDto, @Req() req: any) {
    return this.ventasService.abrirCaja(req.user.userId, dto);
  }

  @Post('cerrar-caja')
  @Roles('ADMINISTRADOR', 'CAJERO')
  async cerrar(@Body() dto: CerrarCajaDto, @Req() req: any) {
    return this.ventasService.cerrarCaja(req.user.userId, dto);
  }

  @Get('resumen-cierre')
  @Roles('ADMINISTRADOR', 'CAJERO')
  async resumen(@Req() req: any) {
    return this.ventasService.obtenerResumenSesion(req.user.userId);
  }

  @Post('procesar')
  @Roles('ADMINISTRADOR', 'CAJERO')
  async vender(@Body() dto: ProcesarVentaDto, @Req() req: any) {
    return this.ventasService.procesarVenta(req.user.userId, dto);
  }

  @Patch(':id/anular')
  @Roles('ADMINISTRADOR')
  async anular(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.ventasService.anularVenta(req.user.userId, id);
  }
}