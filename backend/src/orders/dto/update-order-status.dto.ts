import { IsString, IsIn, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ConfirmItemDto {
  @IsString({ message: 'El ID del producto es obligatorio' })
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  quantity: number;
}

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsString({ message: 'El estado es obligatorio' })
  @IsIn(['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'], {
    message: 'Estado inválido',
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'El estado de pago es obligatorio' })
  @IsIn(['UNPAID', 'PAID'], {
    message: 'Estado de pago inválido',
  })
  paymentStatus?: string;

  @IsOptional()
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ConfirmItemDto)
  items?: ConfirmItemDto[];
}
