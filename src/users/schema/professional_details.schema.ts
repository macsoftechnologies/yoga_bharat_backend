import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class ProfessionalDetails extends Document{
    @Prop({ default: uuid })
    profId: string
    @Prop()
    profession_name: string
    @Prop()
    profession_icon: string
}

export const professionalDetailsSchema = SchemaFactory.createForClass(ProfessionalDetails);