import { ApiProperty } from "@nestjs/swagger";

export class adminDto{
    @ApiProperty()
    emailId: string
    @ApiProperty()
    password: string
    @ApiProperty()
    role: string
}