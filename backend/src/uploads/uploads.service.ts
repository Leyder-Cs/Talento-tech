import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.images.length + files.length > 5) {
      throw new ConflictException(
        'Máximo 5 imágenes por producto',
      );
    }

    const createdImages: Array<{ id: string; productId: string; imageUrl: string; isPrimary: boolean; createdAt: Date }> = [];
    for (const file of files) {
      const base64 = file.buffer.toString('base64');
      const imageUrl = `data:${file.mimetype};base64,${base64}`;
      const isPrimary: boolean =
        product.images.length === 0 && createdImages.length === 0;

      const image = await this.prisma.productImage.create({
        data: { productId, imageUrl, isPrimary },
      });
      createdImages.push(image);
    }

    return createdImages;
  }

  async uploadCategoryImage(file: Express.Multer.File) {
    const base64 = file.buffer.toString('base64');
    const imageUrl = `data:${file.mimetype};base64,${base64}`;

    return { imageUrl };
  }

  async getProductImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return this.parseDataUri(image.imageUrl);
  }

  async getCategoryImage(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.parseDataUri(category.imageUrl);
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    const remainingImages = await this.prisma.productImage.findMany({
      where: { productId: image.productId },
      orderBy: { createdAt: 'asc' },
    });
    if (image.isPrimary && remainingImages.length > 0) {
      await this.prisma.productImage.update({
        where: { id: remainingImages[0].id },
        data: { isPrimary: true },
      });
    }

    return { message: 'Imagen eliminada correctamente' };
  }

  async setPrimary(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.prisma.productImage.updateMany({
      where: { productId: image.productId, isPrimary: true },
      data: { isPrimary: false },
    });

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  /* ───────── helpers ───────── */

  private parseDataUri(dataUri: string) {
    // Nuevo formato: data:image/jpeg;base64,...
    const match = dataUri.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (match) {
      return {
        buffer: Buffer.from(match[3], 'base64'),
        mime: match[1],
      };
    }

    // Fallback: ruta legacy en disco — para imágenes subidas antes del cambio a DB
    const legacyPath = path.join(
      __dirname, '..', '..', '..', 'uploads',
      dataUri.replace(/^\/uploads\//, ''),
    );
    if (fs.existsSync(legacyPath)) {
      const ext = path.extname(legacyPath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      return {
        buffer: fs.readFileSync(legacyPath),
        mime: mimeMap[ext] || 'image/jpeg',
      };
    }

    throw new BadRequestException('Imagen no disponible en la base de datos ni en disco');
  }
}
