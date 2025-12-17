import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
export class FeatureDetails extends Document {
  @Prop({ default: uuid })
  featureId: string;
  @Prop()
  feature_image: string;
  @Prop()
  usertype: string;
}

export const FeatureDetailsSchema =
  SchemaFactory.createForClass(FeatureDetails);
