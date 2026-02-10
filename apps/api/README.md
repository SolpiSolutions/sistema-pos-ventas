## Configuración del Proyecto

```bash
$ pnpm install
```

## Compilación y ejecución del proyecto

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

# POS - Backend

Sistema de Punto de Venta (POS) optimizado para negocios gastronómicos. Desarrollado con **NestJS**, **Fastify**, y **Drizzle ORM**.

## 🚀 Tecnologías Principales
* **Framework:** NestJS (Node.js) con Adaptador Fastify.
* **Base de Datos:** PostgreSQL.
* **ORM:** Drizzle ORM (Type-safe).
* **Validación:** Zod.
* **Autenticación:** JWT (JSON Web Tokens).

## 🛠️ Arquitectura de Módulos
El sistema está dividido en 4 pilares fundamentales:

### 1. Ventas & Sesiones de Caja
Maneja el ciclo de vida del dinero en el local.
- **Sesión de Caja:** Apertura y cierre manual con control de faltantes/sobrantes.
- **Ventas:** Procesamiento atómico (se descuenta stock y se registra la venta en una sola transacción).

### 2. Inventario & Recetas
Control estricto de insumos.
- **Recetas:** Cada producto (ej. Fresas con crema) tiene una receta vinculada a múltiples insumos.
- **Movimientos:** Registro histórico de cada gramo/unidad descontada.

### 3. Reportes & Analítica
Transformación de datos en decisiones.
- **Dashboard:** Estadísticas de Ticket Promedio, Ventas por método de pago y Top Productos.
- **Exportación:** Generación de reportes en formato CSV compatibles con Excel.

### 4. Seguridad
- **RBAC:** Control de acceso basado en roles (`ADMINISTRADOR`, `CAJERO`).

## 📋 Endpoints Principales
| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| `POST` | `/ventas/abrir-caja` | CAJERO/ADMIN | Inicia turno con monto inicial. |
| `POST` | `/ventas/procesar` | CAJERO/ADMIN | Registra venta y descuenta stock. |
| `GET` | `/reportes/dashboard` | ADMIN | Resumen estadístico avanzado. |
| `GET` | `/reportes/exportar/csv` | ADMIN | Descarga de reporte de ventas. |

## 5. Migrar la base de datos
```bash
# generar (no debería ser necesario)
$ pnpm db:generate

# migrar
$ pnpm db:migrate

# para visualizar la base de datos
$ pnpm db:studio
```