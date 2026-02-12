import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CallRequestStatus } from 'src/auth/guards/roles.enum';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class CallRequest extends Document {
  @Prop({ default: uuid })
  callRequestId: string;
  @Prop()
  mobileNumber: string;
  @Prop()
  scheduledTime: string;
  @Prop()
  userId: string;
  @Prop({ default: CallRequestStatus.PENDING })
  status: string
  @Prop()
  date: string
  @Prop()
  adminId: string
}

export const callRequestSchema = SchemaFactory.createForClass(CallRequest);
