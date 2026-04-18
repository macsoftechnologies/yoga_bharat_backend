import { ApiProperty } from "@nestjs/swagger";

export class categoryDto{
    @ApiProperty()
    categoryId: string
    @ApiProperty()
    category_name: string
    @ApiProperty()
    category_status: string
}