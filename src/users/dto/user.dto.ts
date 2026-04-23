import { ApiProperty } from "@nestjs/swagger";

export class userDto{
    @ApiProperty()
    mobileNumber: string
    @ApiProperty()
    otp: string
    @ApiProperty()
    terms_check: boolean
    @ApiProperty()
    status: string
    @ApiProperty()
    userId: string
}