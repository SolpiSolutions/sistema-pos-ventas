import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as schema from './../db/schema';
import { DRIZZLE } from 'src/db/db.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateProductoDto, UpdateProductoDto } from './dto/catalogo.dto';
import { and, eq, ilike } from 'drizzle-orm';

@Injectable()
export class CatalogoService {
    constructor(
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async findAllCategorias() {
        return await this.db.query.categorias.findMany({
            orderBy: (categorias, { asc }) => [asc(categorias.nombre)],
        });
    }

    async findOneCategoria(id: number) {
        const categoria = await this.db.query.categorias.findFirst({
            where: (categorias) => eq(categorias.id, id),
        });
        if (!categoria) throw new NotFoundException('Categoría no encontrada');
        return categoria;
    }

    async createCategoria(nombre: string) {
        return await this.db.insert(schema.categorias).values({ nombre }).returning();
    }

    async findAllProductos(soloActivos: boolean = true) {
        return await this.db.query.productos.findMany({
            where: soloActivos
                ? (productos) => eq(productos.estado, true)
                : undefined,
            with: {
                categoria: true,
                recetas: {
                    with: { insumo: true }
                }
            },
            orderBy: (productos, { asc }) => [asc(productos.nombre)],
        });
    }

    async findOneProducto(id: string) {
        const producto = await this.db.query.productos.findFirst({
            where: (productos) => eq(productos.id, id),
            with: {
                categoria: true,
                recetas: { with: { insumo: true } }
            }
        });
        if (!producto) throw new NotFoundException('Producto no encontrado');
        return producto;
    }

    async createProducto(dto: CreateProductoDto) {
        const { receta, ...productoData } = dto;

        return await this.db.transaction(async (tx) => {
            const [nuevoProducto] = await tx
                .insert(schema.productos)
                .values({
                    ...productoData,
                    precio: productoData.precio.toString(),
                })
                .returning();

            if (receta && receta.length > 0) {
                const itemsReceta = receta.map((item) => ({
                    productoId: nuevoProducto.id,
                    insumoId: item.insumoId,
                    cantidadRequerida: item.cantidadRequerida.toString(),
                }));

                await tx.insert(schema.recetas).values(itemsReceta);
            }

            return nuevoProducto;
        });
    }

    async updateProducto(id: string, dto: UpdateProductoDto) {
        const { receta, ...productoData } = dto;

        return await this.db.transaction(async (tx) => {
            const [productoActualizado] = await tx
                .update(schema.productos)
                .set({
                    ...productoData,
                    precio: productoData.precio ? productoData.precio.toString() : undefined,
                })
                .where(eq(schema.productos.id, id))
                .returning();

            if (!productoActualizado) throw new NotFoundException('Producto no encontrado');

            if (receta) {
                await tx.delete(schema.recetas).where(eq(schema.recetas.productoId, id));

                if (receta.length > 0) {
                    const itemsReceta = receta.map((item) => ({
                        productoId: id,
                        insumoId: item.insumoId,
                        cantidadRequerida: item.cantidadRequerida.toString(),
                    }));
                    await tx.insert(schema.recetas).values(itemsReceta);
                }
            }

            return productoActualizado;
        });
    }

    async softDeleteProducto(id: string) {
        const [producto] = await this.db
            .update(schema.productos)
            .set({ estado: false })
            .where(eq(schema.productos.id, id))
            .returning();

        if (!producto) throw new NotFoundException('Producto no encontrado');
        return { message: 'Producto desactivado exitosamente' };
    }

    // async buscarProductos(termino: string, categoriaId?: string) {
    //     const condiciones = [ilike(schema.productos.nombre, `%${termino}%`)];

    //     if (categoriaId) {
    //         condiciones.push(eq(schema.productos.categoriaId, parseInt(categoriaId, 10)));
    //     }

    //     return await this.db.query.productos.findMany({
    //         where: and(...condiciones),
    //         with: { categoria: true }
    //     });
    // }
}