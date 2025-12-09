import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class HealthPreference extends Document{
    @Prop({default: uuid})
    prefId: string
    @Prop()
    preference_name: string
    @Prop()
    preference_icon: string
}

export const healthPreferenceSchema = SchemaFactory.createForClass(HealthPreference);