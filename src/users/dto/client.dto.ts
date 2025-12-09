import { ApiProperty } from "@nestjs/swagger";

export class clientDto{
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
    health_preference: string
    @ApiProperty()
    role: string
}