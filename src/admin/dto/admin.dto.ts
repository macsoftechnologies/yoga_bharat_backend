import { ApiProperty } from "@nestjs/swagger";

export class adminDto{
    @ApiProperty()
    adminId: string
    @ApiProperty()
    emailId: string
    @ApiProperty()
    mobileNumber: string
    @ApiProperty()
    password: string
    @ApiProperty()
    role: string
    @ApiProperty()
    otp: string
}