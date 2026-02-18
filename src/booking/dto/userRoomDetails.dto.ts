import { ApiProperty } from "@nestjs/swagger";

export class userRoomDetialsDto{
    @ApiProperty()
    userId: string
    @ApiProperty()
    roomURL: string
    @ApiProperty()
    roomName: string
    @ApiProperty()
    roomCreated: string
    @ApiProperty()
    bookingId: string
}