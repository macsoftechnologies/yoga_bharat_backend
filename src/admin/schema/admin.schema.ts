import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role } from "../../auth/guards/roles.enum";
@Schema({ timestamps: true })
 
export class Admin extends Document{
    @Prop()
    emailId: string
    @Prop()
    password: string
    @Prop({default: Role.ADMIN})
    role: string
}

export const adminSchema = SchemaFactory.createForClass(Admin);