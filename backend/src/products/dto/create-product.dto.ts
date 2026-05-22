import {
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre debe tener máximo 100 caracteres' })
  name: string;

  @IsString({ message: 'El slug debe ser un texto' })
  slug: string;

  @IsString({ message: 'La descripción corta debe ser un texto' })
  @MinLength(10, {
    message: 'La descripción corta debe tener al menos 10 caracteres',
  })
  @MaxLength(200, {
    message: 'La descripción corta debe tener máximo 200 caracteres',
  })
  shortDescription: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(20, {
    message: 'La descripción debe tener al menos 20 caracteres',
  })
  description: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  price: number;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo es 0' })
  stock: number;

  @IsString({ message: 'Los beneficios deben ser un texto' })
  @MinLength(10, { message: 'Los beneficios deben tener al menos 10 caracteres' })
  benefits: string;

  @IsString({ message: 'Los ingredientes deben ser un texto' })
  @MinLength(5, { message: 'Los ingredientes deben tener al menos 5 caracteres' })
  ingredients: string;

  @IsString({ message: 'Las instrucciones deben ser un texto' })
  @MinLength(10, {
    message: 'Las instrucciones deben tener al menos 10 caracteres',
  })
  usageInstructions: string;

  @IsString({ message: 'Las contraindicaciones deben ser un texto' })
  @MinLength(5, {
    message: 'Las contraindicaciones deben tener al menos 5 caracteres',
  })
  contraindications: string;

  @IsOptional()
  @IsBoolean({ message: 'featured debe ser un booleano' })
  featured?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'active debe ser un booleano' })
  active?: boolean;

  @IsString({ message: 'La categoría es obligatoria' })
  categoryId: string;
}
