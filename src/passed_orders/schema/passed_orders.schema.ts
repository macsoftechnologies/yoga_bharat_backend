import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class PassedOrders extends Document{
    @Prop({ default: uuid })
    passed_order_id: string
    @Prop()
    bookingId: string
    @Prop()
    trainerId: string
}

export const passedOrderSchema = SchemaFactory.createForClass(PassedOrders);