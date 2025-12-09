import { ApiProperty } from "@nestjs/swagger";

export class userDto{
    @ApiProperty()
    mobileNumber: string
    @ApiProperty()
    otp: string
}