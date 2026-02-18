import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class InAppNotifications extends Document {
  @Prop({ default: uuid })
  inapp_notification_id: string;
  @Prop()
  userId: string;
  @Prop()
  message: string;
  @Prop()
  roomURL: string;
  @Prop()
  roomName: string;
  @Prop()
  roomCreated: string;
  @Prop()
  status: string;
  @Prop()
  type: string;
}

export const inappNotificationsSchema =
  SchemaFactory.createForClass(InAppNotifications);
