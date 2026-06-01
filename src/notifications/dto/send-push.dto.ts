import { ApiProperty } from "@nestjs/swagger";

export class SendPushDto {
    @ApiProperty({ type: [String] })
    userIds: string[];

    @ApiProperty({ required: false })
    title?: string;

    @ApiProperty()
    message: string;
}
