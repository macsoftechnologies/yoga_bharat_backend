import { ApiProperty } from "@nestjs/swagger";

export class inAppNotificationsDto{
    @ApiProperty()
    inapp_notification_id: string
    @ApiProperty()
    userId: string
    @ApiProperty()
    message: string
    @ApiProperty()
    status: string
    @ApiProperty()
    type: string
}