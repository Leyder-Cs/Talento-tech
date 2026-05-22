import { IsOptional, IsString } from 'class-validator';

export class UpdateReturnDto {
  @IsString()
  returnStatus: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

  @IsOptional()
  @IsString()
  returnReason?: string;
}
