import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /* ───── helpers ───── */

  private mapImages<T extends { images: Array<{ id: string; imageUrl: string; isPrimary: boolean }> }>(item: T) {
    return {
      ...item,
      images: item.images.map((img) => ({
        ...img,
        imageUrl: `/api/uploads/product-image/${img.id}`,
      })),
    };
  }

  private computeRating(product: { reviews: { rating: number }[] }) {
    const reviewCount = product.reviews.length;
    const averageRating =
      reviewCount > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;
    return { averageRating, reviewCount };
  }

  private includeClause() {
    return {
      images: { orderBy: { isPrimary: 'desc' as const } },
      category: true,
      reviews: {
        where: { status: 'APPROVED' },
        select: { rating: true },
      },
    };
  }

  /* ───── queries ───── */

  async findAll(query: QueryProductDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.includeInactive !== 'true') {
      where.active = true;
    }

    if (query.category) {
      where.category = {
        OR: [
          { slug: query.category },
          { parent: { slug: query.category } },
        ],
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { shortDescription: { contains: query.search } },
        { description: { contains: query.search } },
        { benefits: { contains: query.search } },
      ];
    }

    if (query.featured === 'true') {
      where.featured = true;
    }

    if (query.minPrice !== undefined) {
      where.price = { ...(where.price as object || {}), gte: query.minPrice };
    }

    if (query.maxPrice !== undefined) {
      where.price = { ...(where.price as object || {}), lte: query.maxPrice };
    }

    if (query.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    if (query.sort) {
      switch (query.sort) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'name_asc':
          orderBy = { name: 'asc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.includeClause(),
      }),
      this.prisma.product.count({ where }),
    ]);

    const products = data.map((product) => {
      const { reviews, ...rest } = product;
      const rating = this.computeRating(product);
      return this.mapImages({ ...rest, ...rating });
    });

    let filteredProducts = products;
    let filteredTotal = total;

    const minRating = query.minRating;
    if (minRating !== undefined) {
      filteredProducts = products.filter(p => p.averageRating >= minRating);
      filteredTotal = filteredProducts.length;
    }

    return {
      data: filteredProducts,
      meta: { total: filteredTotal, page, limit, totalPages: Math.ceil(filteredTotal / limit) },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const { reviews, ...rest } = product;
    const rating = this.computeRating(product);
    return this.mapImages({ ...rest, ...rating });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, active: true },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const { reviews, ...rest } = product;
    const rating = this.computeRating(product);
    return this.mapImages({ ...rest, ...rating });
  }

  async exportTxt(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const lines: string[] = [];
    const separator = '='.repeat(72);

    for (const product of products) {
      lines.push(separator);
      lines.push(`PRODUCTO: ${product.name}`);
      lines.push(`SLUG: ${product.slug}`);
      lines.push(`CATEGORÍA: ${product.category?.name || 'Sin categoría'}`);
      lines.push(`PRECIO: $${product.price.toLocaleString('es-CO')}`);
      lines.push(`STOCK: ${product.stock}`);
      lines.push(`ACTIVO: ${product.active ? 'Sí' : 'No'}`);
      lines.push(`DESTACADO: ${product.featured ? 'Sí' : 'No'}`);
      lines.push('');
      if (product.shortDescription) {
        lines.push(`DESCRIPCIÓN CORTA:`);
        lines.push(product.shortDescription);
        lines.push('');
      }
      if (product.description) {
        lines.push(`DESCRIPCIÓN:`);
        lines.push(product.description);
        lines.push('');
      }
      if (product.benefits) {
        lines.push(`BENEFICIOS:`);
        lines.push(product.benefits);
        lines.push('');
      }
      if (product.ingredients) {
        lines.push(`INGREDIENTES:`);
        lines.push(product.ingredients);
        lines.push('');
      }
      if (product.usageInstructions) {
        lines.push(`MODO DE USO:`);
        lines.push(product.usageInstructions);
        lines.push('');
      }
      if (product.contraindications) {
        lines.push(`CONTRAINDICACIONES:`);
        lines.push(product.contraindications);
        lines.push('');
      }
      const firstImage = product.images?.[0];
      if (firstImage) {
        lines.push(`IMAGEN: /api/uploads/product-image/${firstImage.id}`);
      }
      lines.push(`CREADO: ${product.createdAt.toISOString()}`);
      lines.push(separator);
      lines.push('');
      lines.push('');
    }

    return lines.join('\n');
  }

  async findFeatured() {
    const products = await this.prisma.product.findMany({
      where: { featured: true, active: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: this.includeClause(),
    });

    return products.map((product) => {
      const { reviews, ...rest } = product;
      const rating = this.computeRating(product);
      return this.mapImages({ ...rest, ...rating });
    });
  }

  async findByCategory(categoryId: string, excludeId?: string) {
    const where: Prisma.ProductWhereInput = {
      active: true,
      categoryId,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const products = await this.prisma.product.findMany({
      where,
      take: 4,
      include: this.includeClause(),
    });

    return products.map((product) => {
      const { reviews, ...rest } = product;
      const rating = this.computeRating(product);
      return this.mapImages({ ...rest, ...rating });
    });
  }

  async create(dto: CreateProductDto) {
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Ya existe un producto con ese slug');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        benefits: dto.benefits,
        ingredients: dto.ingredients,
        usageInstructions: dto.usageInstructions,
        contraindications: dto.contraindications,
        featured: dto.featured ?? false,
        active: dto.active ?? true,
        categoryId: dto.categoryId,
      },
      include: {
        images: true,
        category: true,
      },
    });

    return this.mapImages(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (dto.slug) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe otro producto con ese slug');
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        category: true,
      },
    });

    return this.mapImages(updated);
  }

  async toggleActive(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { active: !product.active },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        category: true,
      },
    });

    return this.mapImages(updated);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        orderItems: { take: 1 },
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.orderItems.length > 0) {
      throw new ConflictException(
        'No se puede eliminar el producto porque tiene órdenes asociadas. Puedes desactivarlo en su lugar.',
      );
    }

    await this.prisma.productImage.deleteMany({ where: { productId: id } });
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Producto eliminado correctamente' };
  }
}
