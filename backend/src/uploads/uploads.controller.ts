import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(new BadRequestException(`Formato inválido: ${file.originalname} (solo JPG, PNG, WebP)`), false);
  } else {
    cb(null, true);
  }
};

const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
};

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  /* ───────── PÚBLICO: servir imágenes desde DB ───────── */

  @Get('product-image/:imageId')
  async getProductImage(@Param('imageId') imageId: string, @Res() res: Response) {
    const { buffer, mime } = await this.uploadsService.getProductImage(imageId);
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  }

  @Get('category-image/:categoryId')
  async getCategoryImage(@Param('categoryId') categoryId: string, @Res() res: Response) {
    const { buffer, mime } = await this.uploadsService.getCategoryImage(categoryId);
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  }

  /* ───────── ADMIN: subir imágenes ───────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('product/:productId/images')
  @UseInterceptors(FilesInterceptor('images', 5, uploadOptions))
  async uploadImages(
    @Param('productId') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se subieron archivos');
    }
    return this.uploadsService.uploadImages(productId, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('category')
  @UseInterceptors(FileInterceptor('image', uploadOptions))
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }
    return this.uploadsService.uploadCategoryImage(file);
  }

  /* ───────── ADMIN: gestionar imágenes ───────── */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('images/:imageId')
  deleteImage(@Param('imageId') imageId: string) {
    return this.uploadsService.deleteImage(imageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('images/:imageId/primary')
  setPrimary(@Param('imageId') imageId: string) {
    return this.uploadsService.setPrimary(imageId);
  }
}
