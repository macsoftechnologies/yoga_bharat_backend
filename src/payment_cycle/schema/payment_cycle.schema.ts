import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid/dist/index.js';

@Schema({ collection: 'paymentcycles', timestamps: true })
export class PaymentCycle extends Document {
  @Prop({ default: uuid })
  cycleId: string;

  @Prop()
  trainerId: string;

  @Prop()
  trainerName: string;

  @Prop()
  trainerEmail: string;

  @Prop()
  trainerMobile: string;

  @Prop()
  account_no: string;

  @Prop()
  ifsc_code: string;

  @Prop()
  account_branch: string;

  @Prop()
  branch_address: string;

  @Prop()
  recipient_name: string;

  @Prop()
  cycleStart: Date;

  @Prop()
  cycleEnd: Date;

  @Prop({ default: 0 })
  totalEarnings: number;

  // @Prop({ default: 0 })
  // platformFee: number;

  // @Prop({ default: 0 })
  // settleableAmount: number;

  @Prop({ default: 0 })
  totalSessions: number;

  @Prop({
    type: String,
    default: 'pending_review',
    enum: ['pending_review', 'approved', 'rejected', 'payout_initiated', 'paid', 'failed'],
    index: true,
  })
  status: string;

  @Prop({ type: String, default: null })
  adminNote: string | null;

  @Prop({ type: String, default: null })
  approvedBy: string | null;

  @Prop({ type: Date, default: null })
  approvedAt: Date | null;

  @Prop({ type: Date, default: null })
  rejectedAt: Date | null;

  @Prop({ type: String, default: null })
  razorpayContactId: string | null;

  @Prop({ type: String, default: null })
  razorpayFundAccountId: string | null;

  @Prop({ type: String, default: null })
  razorpayPayoutId: string | null;

  @Prop({ type: String, default: null })
  razorpayPayoutStatus: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: String, default: null })
  failureReason: string | null;

  @Prop({ type: [String], default: [] })
  earningIds: string[];
}

export const paymentCycleSchema = SchemaFactory.createForClass(PaymentCycle);