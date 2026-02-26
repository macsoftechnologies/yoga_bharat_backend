import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetEarningsDto {
  @IsString()
  trainerId: string;

  @IsOptional()
  @IsIn(['30', '90', '180', '365', 'custom', 'current_fy', '2024-2025', '2023-2024', '2022-2023', '2021-2022'])
  period?: string;

  @IsOptional()
  @IsString()
  startDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  endDate?: string; // YYYY-MM-DD
}