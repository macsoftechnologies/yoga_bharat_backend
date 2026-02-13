import { ApiProperty } from '@nestjs/swagger';

export class MonthlyBookingStatsDto {
  @ApiProperty()
  month: string;
  @ApiProperty()
  bookingCount: number;
  @ApiProperty()
  year: number;
}

export class MonthlyBookingsResponseDto {
  @ApiProperty()
  data: MonthlyBookingStatsDto[];
  @ApiProperty()
  total: number;
}
