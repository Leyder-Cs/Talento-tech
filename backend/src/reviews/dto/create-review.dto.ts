import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString({ message: 'El ID del producto es obligatorio' })
  productId: string;

  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating: number;

  @IsString({ message: 'El comentario debe ser un texto' })
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El comentario debe tener máximo 500 caracteres' })
  comment: string;
}
