import { Module } from "@nestjs/common";
import { CatalogoService } from "./catalogo.service";
import { CloudinaryModule } from "src/common/cloudinary/cloudinary.module";
import { CatalogoController } from "./catalaogo.controller";

@Module({
    imports: [CloudinaryModule],
    controllers: [CatalogoController],
    providers: [CatalogoService],
    exports: [CatalogoService]
})

export class CatalogoModule{ }