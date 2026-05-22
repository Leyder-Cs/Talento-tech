import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@GetUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyOrders(@GetUser('id') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('returnStatus') returnStatus?: string,
  ) {
    return this.ordersService.findAll(page || 1, limit || 10, status, paymentStatus, returnStatus);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/return')
  updateReturn(
    @Param('id') id: string,
    @Body() dto: UpdateReturnDto,
  ) {
    return this.ordersService.updateReturn(id, dto);
  }

  // ─── User-facing: cancel own order ───
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelAsUser(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.ordersService.cancelAsUser(id, userId);
  }

  // ─── User-facing: request return ───
  @UseGuards(JwtAuthGuard)
  @Patch(':id/return-request')
  requestReturn(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body('returnReason') returnReason?: string,
  ) {
    return this.ordersService.requestReturn(id, userId, returnReason);
  }
}
