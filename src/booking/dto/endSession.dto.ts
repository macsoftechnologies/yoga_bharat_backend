import { ApiProperty } from '@nestjs/swagger';

export class endSessionDto {
  @ApiProperty({ required: true, example: 'booking_12345' })
  bookingId: string;
}
