import { ApiProperty } from "@nestjs/swagger";

export class ratingDto{
    @ApiProperty()
    ratingId: string
    @ApiProperty()
    bookingId: string
    @ApiProperty()
    trainerId: string
    @ApiProperty()
    clientId: string
    @ApiProperty()
    rating: string
    @ApiProperty()
    review: string
    @ApiProperty()
    yogaId: string
}