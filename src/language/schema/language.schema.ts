import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class Language extends Document{
    @Prop({ default: uuid })
    languageId: string
    @Prop()
    special_character: string
    @Prop()
    language_name: string
}

export const languageSchema = SchemaFactory.createForClass(Language);