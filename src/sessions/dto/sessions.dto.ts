import { ApiProperty } from '@nestjs/swagger';

export class sessionRoomsDto {
  @ApiProperty()
  roomId: string;
  @ApiProperty()
  roomURL: string;
  @ApiProperty()
  roomName: string;
  @ApiProperty()
  roomCreated: string;
  @ApiProperty()
  clientId: string;
  @ApiProperty()
  trainerId: string;
  @ApiProperty()
  bookingId: string;
}
