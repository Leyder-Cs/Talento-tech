import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PaginationDto } from './dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Patch(':id/block')
  toggleBlock(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.usersService.toggleBlock(id, adminId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.usersService.remove(id, adminId);
  }
}
