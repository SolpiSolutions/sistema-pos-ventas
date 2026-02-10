import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { CatalogoService } from "./catalogo.service";
import { CloudinaryService } from "src/common/cloudinary/cloudinary.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { CreateCategoriaDto, CreateProductoDto, UpdateProductoDto } from "./dto/catalogo.dto";
import type { FastifyRequest } from "fastify";

@Controller('catalogo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogoController {
    constructor(
        private readonly catalogoService: CatalogoService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Get('categorias')
    async findAllCategorias() {
        return this.catalogoService.findAllCategorias();
    }

    @Get('categorias/:id')
    async findOneCat(@Param('id', ParseIntPipe) id: number) {
        return this.catalogoService.findOneCategoria(id);
    }

    @Post('categorias')
    @Roles('ADMINISTRADOR')
    async createCategoria(@Body() dto: CreateCategoriaDto) {
        return this.catalogoService.createCategoria(dto.nombre);
    }

    @Get('productos')
    async findAllProductos(@Query('todos') todos: string) {
        const soloActivos = todos !== 'true';
        return this.catalogoService.findAllProductos(soloActivos);
    }

    @Get('productos/:id')
    async findOneProd(@Param('id') id: string) {
        return this.catalogoService.findOneProducto(id);
    }

    @Post('productos')
    @Roles('ADMINISTRADOR')
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
    async remove(@Param('id') id: string) {
        return this.catalogoService.softDeleteProducto(id);
    }

    // @Get('buscar')
    // async buscar(@Query('nombre') nombre?: string, @Query('categoriaId') categoriaId?: string) {
    //     return this.catalogoService.buscarProductos(nombre || '', categoriaId || '');
    // }
}