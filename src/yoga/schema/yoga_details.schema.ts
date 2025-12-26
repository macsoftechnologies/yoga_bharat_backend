import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class YogaDetails extends Document {
  @Prop({ default: uuid })
  yogaId: string;
  @Prop()
  yoga_name: string;
  @Prop()
  client_price: string;
  @Prop()
  trainer_price: string;
  @Prop()
  yoga_desc: string;
  @Prop()
  yoga_image: string;
  @Prop()
  yoga_icon: string;
  @Prop()
  duration: string
}

export const yogaDetailsSchema = SchemaFactory.createForClass(YogaDetails);
