import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateReturnDto } from './dto/update-return.dto';

const DEDUCTED_STATES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Uno o más productos no existen o están inactivos',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Producto ${item.productId} no encontrado`,
        );
      }
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `La cantidad para "${product.name}" debe ser mayor a 0`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Deducción atómica de stock: updateMany con WHERE stock >= quantity
      for (const item of dto.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          throw new BadRequestException(
            `Stock insuficiente para "${product?.name ?? 'producto'}". Disponible: ${product?.stock ?? 0}`,
          );
        }
      }

      let total = 0;
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        total += product.price * item.quantity;
      }

      return tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });
    });
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 10, status?: string, paymentStatus?: string, returnStatus?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, any> = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
    };
    if (returnStatus === 'ANY') {
      where.returnStatus = { not: 'NONE' };
    } else if (returnStatus) {
      where.returnStatus = returnStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, stock: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Restaurar stock si la orden había descontado inventario
    if (DEDUCTED_STATES.includes(order.status)) {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.delete({ where: { id } });
        return { message: 'Pedido eliminado correctamente' };
      });
    }

    await this.prisma.order.delete({ where: { id } });
    return { message: 'Pedido eliminado correctamente' };
  }

  async updateReturn(id: string, dto: UpdateReturnDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const data: Record<string, any> = { returnStatus: dto.returnStatus };
    if (dto.returnReason !== undefined) data.returnReason = dto.returnReason;
    if (dto.returnStatus === 'REQUESTED') data.returnRequestedAt = new Date();

    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const wasDeducted = DEDUCTED_STATES.includes(order.status);
    const newStatus = dto.status || order.status;
    const willBeDeducted = DEDUCTED_STATES.includes(newStatus);

    if (dto.status === 'CONFIRMED') {
      return this.prisma.$transaction(async (tx) => {
        const itemsToConfirm = dto.items && dto.items.length > 0
          ? dto.items.filter((i) => i.quantity > 0)
          : order.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            }));

        if (itemsToConfirm.length === 0) {
          throw new BadRequestException('Debe confirmar al menos un producto con cantidad mayor a 0');
        }

        if (!wasDeducted) {
          // Órdenes PENDING viejas (antes de este fix) — stock nunca deducido
          for (const item of itemsToConfirm) {
            const result = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (result.count === 0) {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
              });
              throw new BadRequestException(
                `Stock insuficiente para "${product?.name ?? 'producto'}". Disponible: ${product?.stock ?? 0}`,
              );
            }
          }
        } else if (dto.items && dto.items.length > 0) {
          // Stock ya deducido en creación — ajustar por delta si el admin cambió cantidades
          const existingProductIds = new Set(order.items.map((i) => i.productId));

          for (const newItem of dto.items) {
            const originalItem = order.items.find((i) => i.productId === newItem.productId);
            if (!originalItem) continue; // producto nuevo — se maneja abajo
            const delta = newItem.quantity - originalItem.quantity;

            if (delta > 0) {
              const result = await tx.product.updateMany({
                where: { id: newItem.productId, stock: { gte: delta } },
                data: { stock: { decrement: delta } },
              });
              if (result.count === 0) {
                const product = await tx.product.findUnique({
                  where: { id: newItem.productId },
                });
                throw new BadRequestException(
                  `Stock insuficiente para aumentar cantidad en "${product?.name ?? 'producto'}". Disponible: ${product?.stock ?? 0}`,
                );
              }
            } else if (delta < 0) {
              await tx.product.update({
                where: { id: newItem.productId },
                data: { stock: { increment: -delta } },
              });
            }
          }

          // Productos nuevos agregados en confirmación
          for (const item of dto.items) {
            if (!existingProductIds.has(item.productId)) {
              const result = await tx.product.updateMany({
                where: { id: item.productId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
              });
              if (result.count === 0) {
                const product = await tx.product.findUnique({
                  where: { id: item.productId },
                });
                throw new BadRequestException(
                  `Stock insuficiente para nuevo producto "${product?.name ?? 'producto'}". Disponible: ${product?.stock ?? 0}`,
                );
              }
            }
          }
        }

        if (dto.items && dto.items.length > 0) {
          const existingProductIds = new Set(order.items.map((i) => i.productId));

          for (const item of dto.items) {
            if (existingProductIds.has(item.productId)) {
              await tx.orderItem.updateMany({
                where: { orderId: id, productId: item.productId },
                data: { quantity: item.quantity },
              });
            } else {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: { price: true },
              });
              if (!product) {
                throw new NotFoundException(`Producto ${item.productId} no encontrado`);
              }
              await tx.orderItem.create({
                data: {
                  orderId: id,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: product.price,
                },
              });
            }
          }
        }

        const updatedItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });
        const total = updatedItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );

        return tx.order.update({
          where: { id },
          data: { status: 'CONFIRMED', total, paymentStatus: dto.paymentStatus || order.paymentStatus },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        });
      });
    }

    if (newStatus === 'CANCELLED' && wasDeducted) {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        const updateData: Record<string, string> = {};
        if (dto.status) updateData.status = dto.status;
        if (dto.status === 'DELIVERED') updateData.paymentStatus = 'PAID';
        else if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;

        return tx.order.update({
          where: { id },
          data: updateData,
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        });
      });
    }

    const updateData: Record<string, string> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.status === 'DELIVERED') updateData.paymentStatus = 'PAID';
    else if (dto.paymentStatus) updateData.paymentStatus = dto.paymentStatus;

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async cancelAsUser(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('No podés cancelar un pedido que no te pertenece');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Solo podés cancelar pedidos pendientes');
    }

    // Restaurar stock (se dedujo al crear la orden)
    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });
    });
  }

  async requestReturn(orderId: string, userId: string, returnReason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('No podés solicitar devolución de un pedido que no te pertenece');
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Solo podés solicitar devolución de pedidos entregados');
    }
    if (order.returnStatus !== 'NONE') {
      throw new BadRequestException('Ya hay una solicitud de devolución activa para este pedido');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        returnStatus: 'REQUESTED',
        returnReason: returnReason || null,
        returnRequestedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }
}
