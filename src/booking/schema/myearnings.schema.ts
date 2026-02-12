import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class MyEarnings extends Document{
    @Prop({ default: uuid })
    myearning_id: string
    @Prop()
    learner_id: string
    @Prop()
    trainer_id: string
    @Prop()
    earned_amount: string
    @Prop()
    date: string
    @Prop()
    bookingId: string
    @Prop()
    yogaId: string
}

export const myEarningSchema = SchemaFactory.createForClass(MyEarnings);