import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TicketStatus } from 'src/auth/guards/roles.enum';

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, unique: true })
  ticketId: string; // TKT-2026-0001

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ default: TicketStatus.OPEN })
  status: string;

  @Prop({ default: '' })
  lastMessage: string;

  @Prop({ default: false })
  isClosed: boolean;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
