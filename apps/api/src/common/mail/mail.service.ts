import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: false, // true para 465, false para otros
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendResetCode(email: string, code: string) {
        await this.transporter.sendMail({
            from: `"Vaquita POS" <${this.configService.get('MAIL_USER')}>`,
            to: email,
            subject: 'Código de recuperación - POS',
            html: `
                <div style="text-align: center; font-family: sans-serif;">
                    <h2>Código de Recuperación</h2>
                    <p>Usa el siguiente código para restablecer tu contraseña:</p>
                    <h1 style="letter-spacing: 5px; color: #2563eb;">${code}</h1>
                    <p>Este código expira en 15 minutos.</p>
                </div>
            `,
        });
    }
}