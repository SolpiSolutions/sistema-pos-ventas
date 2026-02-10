import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CategoriaSchema = z.object({
    nombre: z.string().min(3).max(100),
});

export class CreateCategoriaDto extends createZodDto(CategoriaSchema) { }

export const RecetaItemSchema = z.object({
    insumoId: z.uuid(),
    cantidadRequerida: z.number().positive(),
});

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

export class CreateProductoDto extends createZodDto(ProductoSchema) { }
export class UpdateProductoDto extends createZodDto(UpdateProductoSchema) { }