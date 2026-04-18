import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuid } from "uuid/dist/index.js"

@Schema({ timestamps: true })
export class Category extends Document {
    @Prop({ default: uuid })
    categoryId: string
    @Prop()
    category_name: string
    @Prop({ default: 'enable' })
    category_status: string
}

export const categorySchema = SchemaFactory.createForClass(Category);