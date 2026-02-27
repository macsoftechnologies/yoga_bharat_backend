import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class OrderAlert extends Document {
  @Prop({ default: uuid })
  alertId: string;
  @Prop()
  bookingId: string;
  @Prop()
  clientId: string;
  @Prop()
  trainerId: string;
  @Prop()
  yogaId: string;
  @Prop({ default: 'pending' })
  status: string;
}

export const orderAlertSchema = SchemaFactory.createForClass(OrderAlert);
