import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ timestamps: true })
export class SessionStatus extends Document{
    @Prop({default: uuid})
    session_status_id: string;
    @Prop()
    trainerId: string;
    @Prop()
    clientId: string;
    @Prop({default: 'no'})
    trainer_joined_status: string;
    @Prop({default: 'no'})
    client_joined_status: string;
    @Prop()
    date: string;
    @Prop()
    time: string;
    @Prop()
    bookingId: string;
}

export const sessionStatusSchema = SchemaFactory.createForClass(SessionStatus);