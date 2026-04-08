import { ApiProperty } from "@nestjs/swagger";

export class sessionStatusDto{
    @ApiProperty()
    session_status_id: string;
    @ApiProperty()
    trainerId: string;
    @ApiProperty()
    clientId: string;
    @ApiProperty()
    trainer_joined_status: string;
    @ApiProperty()
    client_joined_status: string;
    @ApiProperty()
    date: string;
    @ApiProperty()
    time: string;
    @ApiProperty()
    bookingId: string;
}