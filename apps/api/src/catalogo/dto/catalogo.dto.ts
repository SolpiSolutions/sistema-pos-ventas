import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CategoriaSchema = z.object({
    nombre: z.string().min(3).max(100),
});

export class CreateCategoriaDto extends createZodDto(CategoriaSchema) { }

export const RecetaItemSchema = z.object({
    insumoId: z.uuid(),
    cantidadRequerida: z.number().positive(),
});

export class RecetaItemDto {
    @ApiProperty({
        description: 'ID del insumo',
        format: 'uuid',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    insumoId: string;

    @ApiProperty({
        description: 'Cantidad requerida del insumo',
        example: 2,
    })
    cantidadRequerida: number;
}

export const ProductoSchema = z.object({
    nombre: z.string().min(3),
    precio: z.coerce.number().positive(),
    categoriaId: z.coerce.number().int(),
    estado: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
    imagenUrl: z.url().optional().nullable(),
    receta: z.preprocess((val) => {
        if (typeof val === 'string') return JSON.parse(val);
        return val;
    }, z.array(RecetaItemSchema)).optional(),
});

export const UpdateProductoSchema = ProductoSchema.partial().extend({
    estado: z.preprocess((val) => {
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        return undefined;
    }, z.boolean().optional()),
});

export class CreateProductoDto extends createZodDto(ProductoSchema) {
    @ApiProperty({ description: 'Nombre del producto', example: 'Empanada de carne' })
    nombre: string;

    @ApiProperty({ description: 'Precio del producto', example: 3.5, type: Number })
    precio: number;

    @ApiProperty({ description: 'ID de la categoría', example: 1, type: Number })
    categoriaId: number;

    @ApiProperty({ description: 'Estado del producto', example: true })
    estado: boolean;

    @ApiPropertyOptional({ description: 'URL de la imagen del producto', example: 'https://example.com/img.png' })
    imagenUrl?: string | null;

    @ApiPropertyOptional({ description: 'Receta del producto (insumos requeridos)', type: () => RecetaItemDto, isArray: true })
    receta?: RecetaItemDto[];
}
export class UpdateProductoDto extends createZodDto(UpdateProductoSchema) {
    @ApiPropertyOptional({ description: 'Nombre del producto', example: 'Empanada de carne' })
    nombre?: string;

    @ApiPropertyOptional({ description: 'Precio del producto', example: 3.5, type: Number })
    precio?: number;

    @ApiPropertyOptional({ description: 'ID de la categoría', example: 1, type: Number })
    categoriaId?: number;

    @ApiPropertyOptional({ description: 'Estado del producto', example: true })
    estado?: boolean;

    @ApiPropertyOptional({ description: 'URL de la imagen del producto', example: 'https://example.com/img.png' })
    imagenUrl?: string | null;

    @ApiPropertyOptional({ description: 'Receta del producto (insumos requeridos)', type: () => RecetaItemDto, isArray: true })
    receta?: RecetaItemDto[];
}