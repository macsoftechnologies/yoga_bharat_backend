import { ApiProperty } from "@nestjs/swagger";

export class userDeleteDto{
    @ApiProperty()
    userId: string
    @ApiProperty()
    otp: string
    @ApiProperty()
    status: string
}