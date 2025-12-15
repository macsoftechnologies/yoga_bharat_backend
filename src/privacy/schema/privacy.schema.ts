import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class Privacy extends Document {
  @Prop({ default: uuid })
  privacyId: string;
  @Prop()
  text: string;
  @Prop()
  usertype: string;
}

export const privacySchema = SchemaFactory.createForClass(Privacy);
