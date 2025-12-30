import { ApiProperty } from "@nestjs/swagger";

export class certificateDto{
    @ApiProperty()
    certificateId: string
    @ApiProperty()
    cerificate: string
    @ApiProperty()
    headline: string
    @ApiProperty()
    description: string
    @ApiProperty()
    userId: string
}