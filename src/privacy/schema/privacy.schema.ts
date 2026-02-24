import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class Privacy extends Document {
  @Prop({ default: uuid })
  privacyId: string;
  @Prop()
  privacy_policy: string;
  @Prop()
  usertype: string;
  @Prop({ default: 'valid' })
  status: string;
  @Prop({ default: 'success' })
  message: string;
}

export const privacySchema = SchemaFactory.createForClass(Privacy);
