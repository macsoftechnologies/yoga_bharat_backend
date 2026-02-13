import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty()
  totalEarnings: number;
  @ApiProperty()
  totalEarningsAmount: number;
  @ApiProperty()
  totalBookings: number;
  @ApiProperty()
  activeClients: number;
  @ApiProperty()
  activeTrainers: number;
  @ApiProperty()
  fromDate: string;
  @ApiProperty()
  toDate: string;
}
