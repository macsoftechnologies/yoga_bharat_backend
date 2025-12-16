import { ApiProperty } from "@nestjs/swagger";

export class bookingDto{
    @ApiProperty()
    bookingId: string
    @ApiProperty()
    bookingType: string
    @ApiProperty()
    languageId: string
    @ApiProperty()
    yogaId: string
    @ApiProperty()
    accepted_trainerId: string
    @ApiProperty()
    clientId: string
    @ApiProperty()
    scheduledDate: string
    @ApiProperty()
    time: string
    @ApiProperty()
    package_details: string
    @ApiProperty()
    sessionId: string
    @ApiProperty()
    transactionId: string
    @ApiProperty()
    status: string
    @ApiProperty()
    trainerIds: []
}