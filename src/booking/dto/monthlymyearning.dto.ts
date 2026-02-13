import { ApiProperty } from '@nestjs/swagger';

export class MonthlyEarningStatsDto {
  @ApiProperty()
  month: string;
  @ApiProperty()
  earningCount: number;
  @ApiProperty()
  totalAmount: number;
  @ApiProperty()
  year: number;
}

export class MonthlyEarningsResponseDto {
  @ApiProperty()
  data: MonthlyEarningStatsDto[];
  @ApiProperty()
  totalEarnings: number;
  @ApiProperty()
  totalTransactions: number;
}
