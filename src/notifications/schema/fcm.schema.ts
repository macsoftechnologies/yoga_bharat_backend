import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export class FCMTokens extends Document{
    @Prop()
    userId: string
    @Prop()
    fcmToken: string
    @Prop()
    deviceType: string
    @Prop()
    deviceId: string
}

export const fcmSchema = SchemaFactory.createForClass(FCMTokens);