import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.favoritesService.findAllByUser(req.user.id);
  }

  @Post(':productId')
  add(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.add(req.user.id, productId);
  }

  @Delete(':productId')
  remove(
    @Request() req: { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(req.user.id, productId);
  }
}
