import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { CatalogoService } from "./catalogo.service";
import { CloudinaryService } from "src/common/cloudinary/cloudinary.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CreateCategoriaDto, CreateProductoDto, UpdateProductoDto } from "./dto/catalogo.dto";
import type { FastifyRequest } from "fastify";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller('catalogo')
@ApiTags('Catálogo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogoController {
    constructor(
        private readonly catalogoService: CatalogoService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Get('categorias')
    @ApiOperation({ summary: 'Obtener todas las categorías' })
    @ApiResponse({ status: 200, description: 'Lista de categorías' })
    async findAllCategorias() {
        return this.catalogoService.findAllCategorias();
    }

    @Get('categorias/:id')
    @ApiOperation({ summary: 'Obtener categoría por ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID de la categoría' })
    @ApiResponse({ status: 200, description: 'Categoría encontrada' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    async findOneCat(@Param('id', ParseIntPipe) id: number) {
        return this.catalogoService.findOneCategoria(id);
    }

    @Post('categorias')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Crear nueva categoría', description: 'Solo disponible para administradores' })
    @ApiBody({ type: CreateCategoriaDto })
    @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    async createCategoria(@Body() dto: CreateCategoriaDto) {
        return this.catalogoService.createCategoria(dto.nombre);
    }

    @Get('productos')
    @ApiOperation({ summary: 'Obtener productos', description: 'Por defecto solo activos. Use todos=true para incluir inactivos' })
    @ApiQuery({ name: 'todos', required: false, type: Boolean, description: 'Si es true, devuelve también productos inactivos' })
    @ApiResponse({ status: 200, description: 'Lista de productos' })
    async findAllProductos(@Query('todos') todos: string) {
        const soloActivos = todos !== 'true';
        return this.catalogoService.findAllProductos(soloActivos);
    }

    @Get('productos/:id')
    @ApiOperation({ summary: 'Obtener producto por ID' })
    @ApiParam({ name: 'id', description: 'ID del producto' })
    @ApiResponse({ status: 200, description: 'Producto encontrado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    async findOneProd(@Param('id') id: string) {
        return this.catalogoService.findOneProducto(id);
    }

    @Post('productos')
    @Roles('ADMINISTRADOR')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Crear nuevo producto', description: 'Requiere file multipart con imagen. Solo administradores' })
    @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createProducto(@Req() req: FastifyRequest) {
        if (!req.isMultipart()) {
            throw new BadRequestException('Se esperaba un formulario multipart');
        }

        const parts = req.parts();
        const fields: Record<string, any> = {};
        let imageUrl: string | null = null;

        for await (const part of parts) {
            if (part.type === 'file') {
                if (part.fieldname === 'imagen' && part.filename) {
                    const buffer = await part.toBuffer();
                    const upload = await this.cloudinaryService.uploadImage(buffer);
                    imageUrl = upload.secure_url;
                }
            } else {
                fields[part.fieldname] = part.value;
            }
        }

        const validatedData = CreateProductoDto.schema.parse({
            ...fields,
            imagenUrl: imageUrl,
        });

        return this.catalogoService.createProducto(validatedData);
    }

    @Patch('productos/:id')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Actualizar producto', description: 'Solo administradores. Permite actualizar con o sin imagen' })
    @ApiParam({ name: 'id', description: 'ID del producto' })
    @ApiResponse({ status: 200, description: 'Producto actualizado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    async updateProducto(@Param('id') id: string, @Req() req: FastifyRequest) {
        if (!req.isMultipart()) {
            const validatedData = UpdateProductoDto.schema.parse(req.body);
            return this.catalogoService.updateProducto(id, validatedData);
        }

        const parts = req.parts();
        const fields: Record<string, any> = {};
        let imageUrl: string | undefined;

        for await (const part of parts) {
            if (part.type === 'file' && part.fieldname === 'imagen' && part.filename) {
                const buffer = await part.toBuffer();
                const upload = await this.cloudinaryService.uploadImage(buffer);
                imageUrl = upload.secure_url;
            } else if (part.type !== 'file') {
                fields[part.fieldname] = part.value;
            }
        }

        const validatedData = UpdateProductoDto.schema.parse({
            ...fields,
            ...(imageUrl && { imagenUrl: imageUrl }),
        });

        return this.catalogoService.updateProducto(id, validatedData);
    }

    @Delete('productos/:id')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Eliminar producto', description: 'Soft delete - marca como inactivo' })
    @ApiParam({ name: 'id', description: 'ID del producto' })
    @ApiResponse({ status: 200, description: 'Producto eliminado' })
    @ApiResponse({ status: 404, description: 'Producto no encontrado' })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    async remove(@Param('id') id: string) {
        return this.catalogoService.softDeleteProducto(id);
    }

    // @Get('buscar')
    // async buscar(@Query('nombre') nombre?: string, @Query('categoriaId') categoriaId?: string) {
    //     return this.catalogoService.buscarProductos(nombre || '', categoriaId || '');
    // }
}