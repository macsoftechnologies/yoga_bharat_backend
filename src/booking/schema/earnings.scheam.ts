import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class Earning extends Document {
  @Prop({ default: uuid })
  earningId: string;
  @Prop()
  bookingId: string;
  @Prop()
  trainerId: string;
  @Prop()
  earned_amount: number;
  @Prop()
  clientId: string;
  @Prop()
  yogaId: string;
  @Prop()
  date: string;
}

export const earningSchema = SchemaFactory.createForClass(Earning);
