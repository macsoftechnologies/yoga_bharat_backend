import { ApiProperty } from '@nestjs/swagger';

export class trainerAvailabilityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startDateTime: Date;

  @ApiProperty()
  endDateTime: Date;

  @ApiProperty()
  isAllDay: boolean;

  @ApiProperty()
  repeat: string;

  @ApiProperty()
  reminderMinutes: number;
}
