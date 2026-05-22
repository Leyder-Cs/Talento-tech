import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@GetUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  addItem(
    @GetUser('id') userId: string,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(userId, body.productId, body.quantity ?? 1);
  }

  @Patch('items/:id')
  updateQuantity(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(userId, itemId, body.quantity);
  }

  @Delete('items/:id')
  removeItem(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
