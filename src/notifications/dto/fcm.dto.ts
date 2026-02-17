import { ApiProperty } from "@nestjs/swagger";

export class fcmDto{
    @ApiProperty()
    userId: string
    @ApiProperty()
    fcmToken: string
    @ApiProperty()
    deviceType: string
    @ApiProperty()
    deviceId: string
}