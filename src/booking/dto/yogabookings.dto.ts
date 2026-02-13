import { ApiProperty } from '@nestjs/swagger';

export class YogaBookingStatsDto {
  @ApiProperty()
  yoga_id: string;
  @ApiProperty()
  yoga_name: string;
  @ApiProperty()
  bookingCount: number;
  @ApiProperty()
  percentage: number;
}

export class YogaBookingsResponseDto {
  @ApiProperty()
  data: YogaBookingStatsDto[];
  @ApiProperty()
  totalBookings: number;
}
