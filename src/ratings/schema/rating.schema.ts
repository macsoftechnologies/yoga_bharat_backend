import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class Rating extends Document{
    @Prop({ default: uuid })
    ratingId: string
    @Prop()
    bookingId: string
    @Prop()
    trainerId: string
    @Prop()
    clientId: string
    @Prop()
    rating: string
    @Prop()
    review: string
    @Prop()
    yogaId: string
}

export const ratingSchema = SchemaFactory.createForClass(Rating);