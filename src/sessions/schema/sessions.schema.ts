import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class RoomSessions extends Document {
  @Prop({ default: uuid })
  roomId: string;
  @Prop()
  roomURL: string;
  @Prop()
  roomName: string;
  @Prop()
  roomCreated: string;
  @Prop()
  clientId: string;
  @Prop()
  trainerId: string;
  @Prop()
  bookingId: string;
}

export const roomSessionSchema = SchemaFactory.createForClass(RoomSessions);
