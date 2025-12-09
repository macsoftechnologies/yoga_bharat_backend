import { ApiProperty } from "@nestjs/swagger";

export class healthPreferenceDto{
    @ApiProperty()
    prefId: string
    @ApiProperty()
    preference_name: string
    @ApiProperty()
    preference_icon: string
}