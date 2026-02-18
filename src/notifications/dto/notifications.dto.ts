import { ApiProperty } from "@nestjs/swagger";

export class notificationsDto{
    @ApiProperty()
    notificationId: string
    @ApiProperty()
    userId: []
    @ApiProperty()
    message: string
}