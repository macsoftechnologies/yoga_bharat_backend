import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class Terms extends Document {
  @Prop({ default: uuid })
  termsId: string;
  @Prop()
  text: string;
  @Prop()
  usertype: string;
}

export const termsSchema = SchemaFactory.createForClass(Terms);
