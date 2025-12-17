import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class AppTutorial extends Document {
  @Prop({ default: uuid })
  appId: string;
  @Prop()
  app_image: string;
  @Prop()
  usertype: string;
}

export const AppTutorialSchema = SchemaFactory.createForClass(AppTutorial);
