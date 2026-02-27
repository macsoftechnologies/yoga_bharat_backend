import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TrainerEvents extends Document {
  @Prop()
  userId: string

  @Prop()
  title: string;

  @Prop()
  startDateTime: Date;

  @Prop()
  endDateTime: Date;

  @Prop({ default: false })
  isAllDay: boolean;

  @Prop({
    type: String,
    enum: ['one-time', 'daily', 'weekly', 'monthly'],
    default: 'one-time',
  })
  repeat: string;

  @Prop({ default: 5 })
  reminderMinutes: number;
}

export const trainerEventSchema = SchemaFactory.createForClass(TrainerEvents);
