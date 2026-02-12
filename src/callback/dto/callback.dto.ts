import { ApiProperty } from "@nestjs/swagger";

export class callRequestDto{
    @ApiProperty()
    callRequestId: string
    @ApiProperty()
    mobileNumber: string
    @ApiProperty()
    scheduledTime: string
    @ApiProperty()
    userId: string
    @ApiProperty()
    status: string
    @ApiProperty()
    date: string
    @ApiProperty()
    adminId: string
}