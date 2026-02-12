import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class SplashScreen extends Document {
  @Prop({ default: uuid })
  splashscreenId: string;
  @Prop()
  text: string;
  @Prop()
  screen_type: string;
  @Prop()
  screen_no: string;
}

export const splashScreenSchema = SchemaFactory.createForClass(SplashScreen);
