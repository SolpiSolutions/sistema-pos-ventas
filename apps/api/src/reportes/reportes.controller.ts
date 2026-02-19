import { Controller, Get, Res, UseGuards, Param } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('reportes')
@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('dashboard')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Obtener dashboard principal', description: 'Devuelve una vista general con métricas del restaurante. Solo administradores' })
    @ApiResponse({ status: 200, description: 'Dashboard obtenido exitosamente' })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    async obtenerDashboard() {
        return await this.reportesService.obtenerDashboardPrincipal();
    }

    @Get('exportar/ventas-csv')
    @Roles('ADMINISTRADOR')
    @ApiOperation({ summary: 'Exportar ventas como CSV', description: 'Genera un archivo CSV con todas las ventas registradas. Solo administradores' })
    @ApiResponse({ status: 200, description: 'Archivo CSV generado', schema: { type: 'string', format: 'binary' } })
    @ApiResponse({ status: 403, description: 'No tiene permisos' })
    async exportarCSV(@Res() res: FastifyReply) {
        const csv = await this.reportesService.generarCSVVentas();
        const fileName = `ventas-vaquita-${Date.now()}.csv`;

        return res
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename=${fileName}`)
            .send(csv);
    }

    // @Get('ticket/:id')
    // async descargarTicket(@Param('id') id: string, @Res() res: FastifyReply) {
    //     const pdfDoc = await this.reportesService.generarPDFTicket(id);

    //     return res
    //         .header('Content-Type', 'application/pdf')
    //         .header('Content-Disposition', `inline; filename=ticket-${id}.pdf`)
    //         .send(pdfDoc);
    // }
}