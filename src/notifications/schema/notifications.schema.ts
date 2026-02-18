import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class Notifications extends Document {
  @Prop({ default: uuid })
  notificationId: string;
  @Prop()
  userId: [];
  @Prop()
  message: string;
}

export const notificationsSchema = SchemaFactory.createForClass(Notifications);
