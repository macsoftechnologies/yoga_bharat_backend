import { ApiProperty } from "@nestjs/swagger";

export class orderAlertDto{
    @ApiProperty()
    alertId: string
    @ApiProperty()
    bookingId: string
    @ApiProperty()
    clientId: string
    @ApiProperty()
    trainerId: string
    @ApiProperty()
    yogaId: string
    @ApiProperty()
    status: string
}