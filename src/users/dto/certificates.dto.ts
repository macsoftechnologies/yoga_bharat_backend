import { ApiProperty } from "@nestjs/swagger";

export class certificateDto{
    @ApiProperty()
    certificateId: string
    @ApiProperty()
    certificate: string
    @ApiProperty()
    headline: string
    @ApiProperty()
    description: string
    @ApiProperty()
    userId: string
}