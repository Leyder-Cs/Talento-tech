import { IsString, IsIn } from 'class-validator';

export class UpdateReviewStatusDto {
  @IsString({ message: 'El estado es obligatorio' })
  @IsIn(['PENDING', 'APPROVED', 'HIDDEN'], {
    message: 'Estado inválido. Debe ser PENDING, APPROVED o HIDDEN',
  })
  status: string;
}
