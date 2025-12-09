import { ApiProperty } from "@nestjs/swagger";

export class professional_detailsDto{
    @ApiProperty()
    profId: string
    @ApiProperty()
    profession_name: string
    @ApiProperty()
    profession_icon: string
}