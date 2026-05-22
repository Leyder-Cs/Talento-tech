import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories.map((cat) => ({
      ...cat,
      imageUrl: this.resolveImageUrl(cat),
    }));
  }

  private resolveImageUrl(cat: { id: string; imageUrl: string | null }): string | null {
    if (!cat.imageUrl || cat.imageUrl === '') return null;
    if (cat.imageUrl.startsWith('data:')) {
      return `/uploads/category-image/${cat.id}`;
    }
    return cat.imageUrl;
  }

  async findTree() {
    const parents = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { products: true } },
        children: {
          include: { _count: { select: { products: true } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return parents.map((parent) => ({
      ...parent,
      imageUrl: this.resolveImageUrl(parent),
      children: parent.children.map((child) => ({
        ...child,
        imageUrl: this.resolveImageUrl(child),
      })),
    }));
  }

  async create(data: { name: string; imageUrl: string; parentId?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/[áéíóú]/g, (c: string) =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c] || c,
      )
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      if (parent.parentId !== null) {
        throw new ConflictException(
          'Solo se permiten 2 niveles: categoría y subcategoría',
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug,
        imageUrl: data.imageUrl,
        parentId: data.parentId || null,
      },
      include: {
        _count: { select: { products: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      ...category,
      imageUrl: this.resolveImageUrl(category),
    };
  }

  async update(id: string, data: { name: string; imageUrl: string; parentId?: string }) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/[áéíóú]/g, (c: string) =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c] || c,
      )
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.prisma.category.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      throw new ConflictException('Ya existe otra categoría con ese nombre');
    }

    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
      if (parent.parentId !== null) {
        throw new ConflictException(
          'Solo se permiten 2 niveles: categoría y subcategoría',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { name: data.name, slug, imageUrl: data.imageUrl, parentId: data.parentId || null },
      include: { _count: { select: { products: true } } },
    });

    return {
      ...updated,
      imageUrl: this.resolveImageUrl(updated),
    };
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos asociados',
      );
    }

    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene subcategorías asociadas',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Categoría eliminada correctamente' };
  }
}
