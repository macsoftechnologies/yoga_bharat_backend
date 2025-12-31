import { ApiProperty } from "@nestjs/swagger";

export class earningDto{
    @ApiProperty()
    earningId: string
    @ApiProperty()
    bookingId: string
    @ApiProperty()
    trainerId: string
    @ApiProperty()
    earned_amount: number
    @ApiProperty()
    clientId: string
    @ApiProperty()
    yogaId: string
    @ApiProperty()
    date: string
}