import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { InventarioService } from "./inventario.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AjusteStockDto, CreateInsumoDto, UpdateInsumoDto } from "./dto/insumo.dto";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller('inventario')
@ApiTags('Inventario')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) { }

  @Get('insumos')
  @ApiOperation({ summary: 'Obtener todos los insumos' })
  @ApiResponse({ status: 200, description: 'Lista de insumos' })
  async findAll() {
    return this.inventarioService.findAll();
  }

  @Post('insumos')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Crear nuevo insumo', description: 'Solo administradores' })
  @ApiBody({ type: CreateInsumoDto })
  @ApiResponse({ status: 201, description: 'Insumo creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.inventarioService.create(createInsumoDto);
  }

  @Patch('insumos/:id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Actualizar insumo', description: 'Solo administradores' })
  @ApiParam({ name: 'id', description: 'ID del insumo' })
  @ApiBody({ type: UpdateInsumoDto })
  @ApiResponse({ status: 200, description: 'Insumo actualizado' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.inventarioService.update(id, updateInsumoDto);
  }

  @Post('insumos/:id/ajuste')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Ajustar stock de insumo', description: 'Registra un ajuste manual de stock. Solo administradores' })
  @ApiParam({ name: 'id', description: 'ID del insumo' })
  @ApiBody({ type: AjusteStockDto })
  @ApiResponse({ status: 200, description: 'Stock ajustado' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
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
  @ApiOperation({ summary: 'Registrar entrada de stock', description: 'Registra una entrada de insumos. Solo administradores' })
  @ApiBody({ schema: { type: 'object', properties: { insumoId: { type: 'string' }, cantidad: { type: 'number' }, motivo: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Entrada registrada exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene permisos' })
  async entradaStock(@Body() dto: { insumoId: string, cantidad: number, motivo?: string }, @Req() req: any) {
    return this.inventarioService.registrarEntrada(dto, req.user.userId);
  }
}