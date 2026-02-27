import { ApiProperty } from "@nestjs/swagger"

export class passedOrdersDto{
    @ApiProperty()
    passed_order_id: string
    @ApiProperty()
    bookingId: string
    @ApiProperty()
    trainerId: string
}