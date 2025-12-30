import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class Certificate extends Document{
    @Prop({ default: uuid })
    certificateId: string
    @Prop()
    certificate: string
    @Prop()
    headline: string
    @Prop()
    description: string
    @Prop()
    userId: string
}

export const certificateSchema = SchemaFactory.createForClass(Certificate);