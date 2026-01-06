import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role } from "../../auth/guards/roles.enum";
import { v4 as uuid } from 'uuid/dist/index.js';
@Schema({ timestamps: true })
 
export class Admin extends Document{
    @Prop({ default: uuid })
    adminId: string
    @Prop()
    emailId: string
    @Prop()
    mobileNumber: string
    @Prop()
    password: string
    @Prop({default: Role.ADMIN})
    role: string
    @Prop()
    otp: string
}

export const adminSchema = SchemaFactory.createForClass(Admin);