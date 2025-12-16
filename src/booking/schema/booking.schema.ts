import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class Booking extends Document {
  @Prop({default: uuid})
  bookingId: string;
  @Prop()
  bookingType: string;
  @Prop()
  languageId: string;
  @Prop()
  yogaId: string;
  @Prop()
  accepted_trainerId: string;
  @Prop()
  clientId: string;
  @Prop()
  scheduledDate: string;
  @Prop()
  time: string;
  @Prop()
  package_details: string;
  @Prop()
  sessionId: string;
  @Prop()
  transactionId: string;
  @Prop({default: 'opened'})
  status: string;
  @Prop()
  trainerIds: [];
}

export const bookingSchema = SchemaFactory.createForClass(Booking);
