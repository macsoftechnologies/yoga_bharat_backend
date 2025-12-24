import { ApiProperty } from "@nestjs/swagger";

export class userEditDto{
    @ApiProperty()
    userId: string
    @ApiProperty()
    name: string
    @ApiProperty()
    email: string
    @ApiProperty()
    gender: string
    @ApiProperty()
    age: string
    @ApiProperty()
    experience: string
    @ApiProperty()
    professional_details: string
    @ApiProperty()
    profile_pic: string
    @ApiProperty()
    role: string
    @ApiProperty()
    health_preference: string
}