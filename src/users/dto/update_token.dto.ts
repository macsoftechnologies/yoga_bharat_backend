import { ApiProperty } from "@nestjs/swagger";

export class updateTokenDto {
    @ApiProperty()
    userId: string
    @ApiProperty()
    fcm_token: string
}