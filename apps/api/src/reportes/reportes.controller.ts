import { Controller, Get, Res, UseGuards, Param } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    @Get('dashboard')
    @Roles('ADMINISTRADOR')
    async obtenerDashboard() {
        return await this.reportesService.obtenerDashboardPrincipal();
    }

    @Get('exportar/ventas-csv')
    @Roles('ADMINISTRADOR')
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