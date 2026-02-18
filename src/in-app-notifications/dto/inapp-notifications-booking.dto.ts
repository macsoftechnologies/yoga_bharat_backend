import { ApiProperty } from "@nestjs/swagger";

export class inAppBookingNotificationsDto{
    @ApiProperty()
    inapp_notification_id: string
    @ApiProperty()
    userId: string
    @ApiProperty()
    message: string
    @ApiProperty()
    room_url: string
    @ApiProperty()
    room_name: string
    @ApiProperty()
    room_created: string
    @ApiProperty()
    status: string
    @ApiProperty()
    type: string
}