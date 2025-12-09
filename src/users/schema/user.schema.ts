import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })

export class User extends Document{
    @Prop({default : uuid})
    userId: string
    @Prop()
    mobileNumber: string
    @Prop()
    role: string
    @Prop()
    name: string
    @Prop()
    email: string
    @Prop()
    gender: string
    @Prop()
    age: string
    @Prop()
    health_preference: string
    @Prop()
    experience: string
    @Prop()
    professional_details: string
    @Prop()
    profile_pic: string
    @Prop({ type: [String] })
    certificates: string[];
    @Prop({ type: [String] })
    journey_images: string[];
    @Prop()
    yoga_video: string
    @Prop()
    recipient_name: string
    @Prop()
    account_no: string
    @Prop()
    ekyc_status: string
    @Prop()
    otp: string
}

export const userSchema = SchemaFactory.createForClass(User);