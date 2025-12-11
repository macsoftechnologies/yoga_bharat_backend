import { ApiProperty } from "@nestjs/swagger";

export class languageDto{
    @ApiProperty()
    languageId: string
    @ApiProperty()
    special_character: string
    @ApiProperty()
    language_name: string
}