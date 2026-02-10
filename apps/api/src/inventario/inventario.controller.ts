import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { InventarioService } from "./inventario.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AjusteStockDto, CreateInsumoDto, UpdateInsumoDto } from "./dto/insumo.dto";

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) { }

  @Get('insumos')
  async findAll() {
    return this.inventarioService.findAll();
  }

  @Post('insumos')
  @Roles('ADMINISTRADOR')
  async create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.inventarioService.create(createInsumoDto);
  }

  @Patch('insumos/:id')
  @Roles('ADMINISTRADOR')
  async update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.inventarioService.update(id, updateInsumoDto);
  }

  @Post('insumos/:id/ajuste')
  @Roles('ADMINISTRADOR')
  async ajustarStock(
    @Param('id') id: string,
    @Body() ajusteDto: AjusteStockDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user.userId;
    return this.inventarioService.ajustarStock(id, ajusteDto, usuarioId);
  }

  @Post('entrada')
  @Roles('ADMINISTRADOR')
  async entradaStock(@Body() dto: { insumoId: string, cantidad: number, motivo?: string }, @Req() req: any) {
    return this.inventarioService.registrarEntrada(dto, req.user.userId);
  }
}