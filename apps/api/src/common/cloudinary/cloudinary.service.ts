import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    async uploadImage(
        fileBuffer: Buffer,
        folder: string = 'vaquita/productos'
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { folder },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary result undefined'));
                    resolve(result);
                },
            );
            streamifier.createReadStream(fileBuffer).pipe(upload);
        });
    }
}