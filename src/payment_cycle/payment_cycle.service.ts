import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { PaymentCycle } from './schema/payment_cycle.schema';
import { Earning } from 'src/booking/schema/earnings.scheam';
import { User } from 'src/users/schema/user.schema';
import { RazorpayService } from 'src/auth/razorpay.service';
import { YogaDetails } from 'src/yoga/schema/yoga_details.schema';
import { CycleWithEarningsResponse, EnrichedEarning } from './dto/payment_cycle.dto';

// Pricing model:
//   client_price  = ₹600  → client pays
//   trainer_price = ₹400  → earned_amount (trainer's full share)
//   platform cut  = ₹200  → already taken at booking time
//
// Settlement = pay trainer the full sum of earned_amount, no further deductions
//
// NOTE: Razorpay automatic payout is currently DISABLED.
// Admin must manually approve and mark cycles as paid via POST /:id/mark-paid.
// Razorpay payout code is preserved below for future use.

@Injectable()
export class PaymentCyclesService {
  private readonly logger = new Logger(PaymentCyclesService.name);

  constructor(
    @InjectModel(PaymentCycle.name)
    private readonly cycleModel: Model<PaymentCycle>,

    @InjectModel(Earning.name)
    private readonly earningModel: Model<Earning>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(YogaDetails.name)
    private readonly yogaModel: Model<YogaDetails>,

    private readonly razorpayService: RazorpayService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CRON — Every Sunday at midnight
  // ═══════════════════════════════════════════════════════
  @Cron('0 0 * * 0')
  async weeklySettlementCron() {
    this.logger.log('⏰ Weekly settlement cron triggered');
    return this.generateCyclesForAllTrainers();
  }

  // ═══════════════════════════════════════════════════════
  // Generate payment cycles for all trainers
  // ═══════════════════════════════════════════════════════
  async generateCyclesForAllTrainers() {
    const cycleEnd   = new Date();
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 7);
    cycleStart.setHours(0, 0, 0, 0);
    cycleEnd.setHours(23, 59, 59, 999);

    // Fetch all unsettled earnings
    const allUnsettled = await this.earningModel
      .find({ settlementStatus: 'unsettled' })
      .lean();

    // Filter by 7-day window
    // date is stored as string: "Wed Dec 31 2025 05:30:00 GMT+0530 (India Standard Time)"
    const inRange = allUnsettled.filter((e) => {
      try {
        const d = new Date(e.date);
        return d >= cycleStart && d <= cycleEnd;
      } catch {
        return false;
      }
    });

    if (!inRange.length) {
      this.logger.log('No unsettled earnings found in the past 7 days');
      return { message: 'No earnings to process', created: 0 };
    }

    // Group by trainerId and sum earned_amount
    const grouped: Record<string, { earnings: typeof inRange; total: number }> = {};
    for (const e of inRange) {
      if (!grouped[e.trainerId]) {
        grouped[e.trainerId] = { earnings: [], total: 0 };
      }
      grouped[e.trainerId].earnings.push(e);
      grouped[e.trainerId].total += e.earned_amount;
    }

    this.logger.log(`Processing ${Object.keys(grouped).length} trainer(s)`);

    let created = 0;
    const results: any = [];

    for (const [trainerId, data] of Object.entries(grouped)) {
      const trainer = await this.userModel
        .findOne({ userId: trainerId, role: 'trainer' })
        .lean();

      if (!trainer) {
        this.logger.warn(`Trainer userId=${trainerId} not found in users — skipping`);
        continue;
      }

      const cycle = await this.createCycleForTrainer(
        trainer,
        data.earnings,
        data.total,
        cycleStart,
        cycleEnd,
      );

      if (cycle) {
        created++;
        results.push({
          trainerId,
          trainerName:  trainer.name,
          cycleId:      cycle._id,
          totalEarnings: cycle.totalEarnings,
        });
      }
    }

    this.logger.log(`✅ Cron complete — ${created} cycle(s) created`);
    return { created, results };
  }

  // ═══════════════════════════════════════════════════════
  // Create one PaymentCycle for one trainer
  // totalEarnings = full payout amount (no deductions)
  // ═══════════════════════════════════════════════════════
  async createCycleForTrainer(
    trainer:       any,
    earnings:      any[],
    totalEarnings: number,
    cycleStart:    Date,
    cycleEnd:      Date,
  ) {
    // Prevent duplicate cycles for same trainer + period
    const existing = await this.cycleModel.findOne({
      trainerId:  trainer.userId,
      cycleStart: { $gte: cycleStart },
      status:     { $nin: ['rejected'] },
    });

    if (existing) {
      this.logger.warn(
        `Cycle already exists for trainer ${trainer.name} in this period — skipping`,
      );
      return null;
    }

    const cycle = await this.cycleModel.create({
      // Trainer identity
      trainerId:     trainer.userId,
      trainerName:   trainer.name,
      trainerEmail:  trainer.email,
      trainerMobile: trainer.mobileNumber,

      // Bank details snapshot from User document
      account_no:     trainer.account_no     || null,
      ifsc_code:      trainer.ifsc_code      || null,
      account_branch: trainer.account_branch  || null,
      branch_address: trainer.branch_address  || null,
      recipient_name: trainer.recipient_name  || trainer.name,

      cycleStart,
      cycleEnd,

      // Full earned_amount sum — no deductions
      totalEarnings,
      totalSessions: earnings.length,

      status:     'pending_review',
      earningIds: earnings.map((e) => e._id.toString()),
    });

    // Mark all earnings as in_cycle
    await this.earningModel.updateMany(
      { _id: { $in: earnings.map((e) => e._id) } },
      {
        $set: {
          settlementStatus: 'in_cycle',
          paymentCycleId:   cycle.cycleId.toString(),
        },
      },
    );

    this.logger.log(
      `Cycle created | Trainer: ${trainer.name} | ` +
      `Sessions: ${earnings.length} | Payout: ₹${totalEarnings} | ` +
      `Bank: ${trainer.account_no} / ${trainer.ifsc_code}`,
    );

    return cycle;
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — List cycles with filters
  // ═══════════════════════════════════════════════════════
  async getAllCycles(filters: {
    status?:    string;
    trainerId?: string;
    page:       number;
    limit:      number;
  }) {
    const { status, trainerId, page, limit } = filters;
    const query: any = {};
    if (status)    query.status    = status;
    if (trainerId) query.trainerId = trainerId;

    const skip = (page - 1) * limit;
    const [cycles, total] = await Promise.all([
      this.cycleModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.cycleModel.countDocuments(query),
    ]);

    // return { cycles, total, page, limit, totalPages: Math.ceil(total / limit) };
    return {
      statusCode: HttpStatus.OK,
      message: "List of Payment Cycles",
      currentPage: page,
      limit,
      totalPages: Math.ceil(total/limit),
      data: cycles
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Get single cycle
  // ═══════════════════════════════════════════════════════
  async getCycleById(cycleId: string) {
    const cycle = await this.cycleModel.findOne({ cycleId });
    if (!cycle) throw new NotFoundException('Payment cycle not found');
    return {
      statusCode: HttpStatus.OK,
      message: "Payment Cycle Details",
      data: cycle
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Get cycle + its earning records
  // ═══════════════════════════════════════════════════════
  async getCycleWithEarnings(cycleId: string): Promise<CycleWithEarningsResponse> {
    const cycle = await this.getCycleById(cycleId);
    const earnings = await this.earningModel
      .find({ paymentCycleId: cycle.data.cycleId })
      .sort({ date: 1 })
      .lean();
    // return { cycle, earnings, totalSessions: earnings.length };
    const enrichedEarnings = await Promise.all(
    earnings.map(async (earning) => {
      const [trainer, client, yoga] = await Promise.all([
        this.userModel.findOne({ userId: earning.trainerId }).select('name').lean(),
        this.userModel.findOne({ userId: earning.clientId }).select('name').lean(),
        this.yogaModel.findOne({ yogaId: earning.yogaId }).select('yoga_name trainer_price client_price').lean(),
      ]);

      return {
        ...earning,
        trainerName: trainer?.name ?? null,
        clientName: client?.name ?? null,
        yogaName: yoga?.yoga_name ?? null,
        clientPrice: yoga?.client_price ?? null,
        trainerPrice: yoga?.trainer_price ?? null,
      } as unknown as EnrichedEarning;
    })
  );
    return {
      statusCode: HttpStatus.OK,
      message: "Details of Cycle With Earnings",
      totalSessions: earnings.length,
      data: cycle,
      earnings: enrichedEarnings
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Approve cycle
  // ═══════════════════════════════════════════════════════
  async approveCycle(cycleId: string, adminId: string, note?: string) {
    const cycle = await this.cycleModel.findOne({ cycleId });
    if (!cycle) throw new NotFoundException('Cycle not found');

    if (cycle.status !== 'pending_review') {
      throw new BadRequestException(
        `Only pending_review cycles can be approved. Current: ${cycle.status}`,
      );
    }

    // Validate bank details before approving
    const missing = [
      !cycle.account_no     && 'account_no',
      !cycle.ifsc_code      && 'ifsc_code',
      !cycle.recipient_name && 'recipient_name',
    ].filter(Boolean);

    if (missing.length) {
      throw new BadRequestException(
        `Cannot approve — trainer bank details incomplete. ` +
        `Missing: ${missing.join(', ')}. ` +
        `Ask the trainer to complete their bank KYC.`,
      );
    }

    cycle.status     = 'approved';
    cycle.approvedBy = adminId;
    cycle.approvedAt = new Date();
    cycle.adminNote  = note || null;
    await cycle.save();

    this.logger.log(`✅ Cycle ${cycleId} APPROVED by admin ${adminId}`);
    return {
      statusCode: HttpStatus.OK,
      message: "Cycle approved successfully",
      data: cycle
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Reject cycle → earnings revert to unsettled
  // ═══════════════════════════════════════════════════════
  async rejectCycle(cycleId: string, adminId: string, reason: string) {
    const cycle = await this.cycleModel.findOne({ cycleId });
    if (!cycle) throw new NotFoundException('Cycle not found');

    if (!['pending_review', 'approved'].includes(cycle.status)) {
      throw new BadRequestException(
        `Cannot reject a cycle in '${cycle.status}' status`,
      );
    }

    cycle.status     = 'rejected';
    cycle.approvedBy = adminId;
    cycle.rejectedAt = new Date();
    cycle.adminNote  = reason;
    await cycle.save();

    // Revert earnings → re-enter next week's cycle automatically
    await this.earningModel.updateMany(
      { paymentCycleId: cycleId },
      { $set: { settlementStatus: 'unsettled', paymentCycleId: null } },
    );

    this.logger.log(
      `❌ Cycle ${cycleId} REJECTED by ${adminId} — earnings reverted to unsettled`,
    );
    return {
      statusCode: HttpStatus.OK,
      message: "Cycle rejected successfully",
      data: cycle
    }
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Mark cycle as manually paid
  // Use this when payment is done outside the system
  // (bank transfer, UPI, cash, etc.)
  // Only works when status === 'approved'
  // ═══════════════════════════════════════════════════════
  async markCycleAsPaid(
    cycleId:   string,
    adminId:   string,
    details: {
      paymentMethod:    string;   // e.g. "NEFT", "UPI", "Cash", "Cheque"
      transactionRef?:  string;   // UTR / UPI ref / cheque number
      note?:            string;
    },
  ) {
    const cycle = await this.cycleModel.findOne({ cycleId });
    if (!cycle) throw new NotFoundException('Cycle not found');

    if (cycle.status !== 'approved') {
      throw new BadRequestException(
        `Only APPROVED cycles can be marked as paid. Current: ${cycle.status}`,
      );
    }

    cycle.status          = 'paid';
    cycle.paidAt          = new Date();
    cycle.approvedBy      = adminId;  // last admin who acted
    cycle.adminNote       = [
      `Manual payment by admin ${adminId}`,
      `Method: ${details.paymentMethod}`,
      details.transactionRef ? `Ref: ${details.transactionRef}` : null,
      details.note           ? `Note: ${details.note}`          : null,
    ].filter(Boolean).join(' | ');

    await cycle.save();

    // Mark all earnings in this cycle as settled
    await this.earningModel.updateMany(
      { paymentCycleId: cycle.cycleId },
      { $set: { settlementStatus: 'settled' } },
    );

    this.logger.log(
      `💰 MANUALLY PAID | Trainer: ${cycle.trainerName} | ` +
      `₹${cycle.totalEarnings} | Method: ${details.paymentMethod} | ` +
      `Ref: ${details.transactionRef || 'N/A'} | By: ${adminId}`,
    );

    return {
      success:       true,
      cycleId:       cycle.cycleId,
      trainerName:   cycle.trainerName,
      amount:        cycle.totalEarnings,
      paidAt:        cycle.paidAt,
      paymentMethod: details.paymentMethod,
      transactionRef: details.transactionRef || null,
      status:        cycle.status,
    };
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Initiate Razorpay payout
  // ⚠️  DISABLED — manual settlement is used instead.
  //     Code is preserved for future re-enabling.
  //     To re-enable: uncomment this method and restore
  //     the POST /:id/payout route in the controller.
  // ═══════════════════════════════════════════════════════
  // async initiatePayout(cycleId: string) {
  //   const cycle = await this.cycleModel.findOne({ cycleId });
  //   if (!cycle) throw new NotFoundException('Cycle not found');
  //
  //   if (cycle.status !== 'approved') {
  //     throw new BadRequestException(
  //       `Payout can only be initiated for APPROVED cycles. Current: ${cycle.status}`,
  //     );
  //   }
  //
  //   if (cycle.totalEarnings <= 0) {
  //     throw new BadRequestException('Total earnings must be greater than 0');
  //   }
  //
  //   try {
  //     // Step 1 — Razorpay Contact
  //     const contact = await this.razorpayService.createContact({
  //       name:        cycle.recipient_name || cycle.trainerName,
  //       email:       cycle.trainerEmail,
  //       contact:     cycle.trainerMobile,
  //       referenceId: cycle.trainerId,
  //     });
  //
  //     // Step 2 — Fund Account (bank account linked to contact)
  //     const fundAccount = await this.razorpayService.createFundAccount({
  //       contactId:     contact.id,
  //       recipientName: cycle.recipient_name || cycle.trainerName,
  //       accountNo:     cycle.account_no,
  //       ifscCode:      cycle.ifsc_code,
  //     });
  //
  //     // Step 3 — Payout (full earned_amount, no deductions)
  //     const payout = await this.razorpayService.createPayout({
  //       fundAccountId: fundAccount.id,
  //       amountRupees:  cycle.totalEarnings,
  //       cycleId:       cycle._id.toString(),
  //       trainerName:   cycle.trainerName,
  //       mode:          'IMPS',
  //     });
  //
  //     cycle.status                = 'payout_initiated';
  //     cycle.razorpayContactId     = contact.id;
  //     cycle.razorpayFundAccountId = fundAccount.id;
  //     cycle.razorpayPayoutId      = payout.id;
  //     cycle.razorpayPayoutStatus  = payout.status;
  //     await cycle.save();
  //
  //     this.logger.log(
  //       `💸 Payout initiated | Trainer: ${cycle.trainerName} | ` +
  //       `₹${cycle.totalEarnings} → ${cycle.account_no} (${cycle.ifsc_code}) | ` +
  //       `Payout ID: ${payout.id}`,
  //     );
  //
  //     return {
  //       success:      true,
  //       payoutId:     payout.id,
  //       payoutStatus: payout.status,
  //       amount:       cycle.totalEarnings,
  //       trainerName:  cycle.trainerName,
  //       bank: {
  //         recipient_name: cycle.recipient_name,
  //         account_no:     cycle.account_no,
  //         ifsc_code:      cycle.ifsc_code,
  //         account_branch: cycle.account_branch,
  //       },
  //     };
  //   } catch (error) {
  //     cycle.status        = 'failed';
  //     cycle.failureReason = error.message;
  //     await cycle.save();
  //     throw error;
  //   }
  // }

  // ═══════════════════════════════════════════════════════
  // Webhook — payout.processed → mark paid
  // ⚠️  Kept for future Razorpay re-integration
  // ═══════════════════════════════════════════════════════
  // async handlePayoutProcessed(payoutId: string) {
  //   const cycle = await this.cycleModel.findOne({ razorpayPayoutId: payoutId });
  //   if (!cycle) {
  //     this.logger.warn(`No cycle found for payout: ${payoutId}`);
  //     return;
  //   }

  //   cycle.status              = 'paid';
  //   cycle.razorpayPayoutStatus = 'processed';
  //   cycle.paidAt              = new Date();
  //   await cycle.save();

  //   await this.earningModel.updateMany(
  //     { paymentCycleId: cycle.cycleId },
  //     { $set: { settlementStatus: 'settled' } },
  //   );

  //   this.logger.log(
  //     `💰 PAID | Trainer: ${cycle.trainerName} | ₹${cycle.totalEarnings} | Payout: ${payoutId}`,
  //   );
  // }

  // ═══════════════════════════════════════════════════════
  // Webhook — payout.rejected / payout.cancelled
  // ⚠️  Kept for future Razorpay re-integration
  // ═══════════════════════════════════════════════════════
  // async handlePayoutFailed(payoutId: string, reason: string) {
  //   const cycle = await this.cycleModel.findOne({ razorpayPayoutId: payoutId });
  //   if (!cycle) return;

  //   cycle.status              = 'failed';
  //   cycle.razorpayPayoutStatus = 'rejected';
  //   cycle.failureReason       = reason;
  //   await cycle.save();

  //   this.logger.warn(
  //     `⚠️ Payout FAILED | Trainer: ${cycle.trainerName} | Reason: ${reason}`,
  //   );
  // }

  // ═══════════════════════════════════════════════════════
  // Poll Razorpay for latest payout status
  // ⚠️  Kept for future Razorpay re-integration
  // ═══════════════════════════════════════════════════════
  // async syncPayoutStatus(cycleId: string) {
  //   const cycle = await this.cycleModel.findOne({ cycleId });
  //   if (!cycle) throw new NotFoundException('Cycle not found');
  //   if (!cycle.razorpayPayoutId) {
  //     throw new BadRequestException('No payout has been initiated for this cycle');
  //   }

  //   const payout = await this.razorpayService.getPayoutStatus(cycle.razorpayPayoutId);
  //   cycle.razorpayPayoutStatus = payout.status;

  //   if (payout.status === 'processed') {
  //     cycle.status = 'paid';
  //     cycle.paidAt = new Date();
  //     await this.earningModel.updateMany(
  //       { paymentCycleId: cycle.cycleId },
  //       { $set: { settlementStatus: 'settled' } },
  //     );
  //   }

  //   if (['rejected', 'cancelled'].includes(payout.status)) {
  //     cycle.status        = 'failed';
  //     cycle.failureReason = payout.error_message || payout.status;
  //   }

  //   await cycle.save();
  //   return {
  //     cycleId,
  //     payoutId:     payout.id,
  //     payoutStatus: payout.status,
  //     cycleStatus:  cycle.status,
  //   };
  // }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Dashboard stats
  // ═══════════════════════════════════════════════════════
  async getDashboardStats() {
    const [byStatus, pendingData, paidData, trainersWaiting] = await Promise.all([
      this.cycleModel.aggregate([
        {
          $group: {
            _id:         '$status',
            count:       { $sum: 1 },
            totalAmount: { $sum: '$totalEarnings' },
          },
        },
      ]),
      this.cycleModel.aggregate([
        { $match: { status: 'pending_review' } },
        {
          $group: {
            _id:      null,
            total:    { $sum: '$totalEarnings' },
            sessions: { $sum: '$totalSessions' },
            count:    { $sum: 1 },
          },
        },
      ]),
      this.cycleModel.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalEarnings' } } },
      ]),
      this.cycleModel.distinct('trainerId', { status: 'pending_review' }),
    ]);

    return {
      pendingCycles:           pendingData[0]?.count    || 0,
      pendingAmount:           pendingData[0]?.total    || 0,
      pendingSessions:         pendingData[0]?.sessions || 0,
      trainersAwaitingPayment: trainersWaiting.length,
      totalPaidOut:            paidData[0]?.total       || 0,
      byStatus,
    };
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Manual cycle for a specific trainer
  // ═══════════════════════════════════════════════════════
  async manualCreateCycle(trainerId: string, fromDate?: string, toDate?: string) {
    const cycleEnd   = toDate   ? new Date(toDate)   : new Date();
    const cycleStart = fromDate ? new Date(fromDate) : new Date();
    if (!fromDate) cycleStart.setDate(cycleStart.getDate() - 7);
    cycleStart.setHours(0, 0, 0, 0);
    cycleEnd.setHours(23, 59, 59, 999);

    const trainer = await this.userModel
      .findOne({ userId: trainerId, role: 'trainer' })
      .lean();
    if (!trainer) throw new NotFoundException(`Trainer not found: ${trainerId}`);

    const unsettled = await this.earningModel
      .find({ trainerId, settlementStatus: 'unsettled' })
      .lean();

    const inRange = unsettled.filter((e) => {
      try {
        const d = new Date(e.date);
        return d >= cycleStart && d <= cycleEnd;
      } catch { return false; }
    });

    if (!inRange.length) {
      throw new BadRequestException(
        `No unsettled earnings for trainer ${trainer.name} in the given date range`,
      );
    }

    const total = inRange.reduce((sum, e) => sum + e.earned_amount, 0);
    return this.createCycleForTrainer(trainer, inRange, total, cycleStart, cycleEnd);
  }

  // ═══════════════════════════════════════════════════════
  // Preview earnings before creating a manual cycle
  // ═══════════════════════════════════════════════════════
  async previewEarnings(trainerId: string, fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to   = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const trainer = await this.userModel
      .findOne({ userId: trainerId, role: 'trainer' })
      .lean();
    if (!trainer) throw new NotFoundException(`Trainer not found: ${trainerId}`);

    const unsettled = await this.earningModel
      .find({ trainerId, settlementStatus: 'unsettled' })
      .lean();

    const inRange = unsettled.filter((e) => {
      try {
        const d = new Date(e.date);
        return d >= from && d <= to;
      } catch { return false; }
    });

    const totalEarnings = inRange.reduce((s, e) => s + e.earned_amount, 0);

    return {
      statusCode: HttpStatus.OK,
      message: "Unsettled Earnings Preview of trainer",
      trainer: {
        name:               trainer.name,
        email:              trainer.email,
        mobile:             trainer.mobileNumber,
        ekyc_status:        trainer.ekyc_status,
        recipient_name:     trainer.recipient_name,
        account_no:         trainer.account_no,
        ifsc_code:          trainer.ifsc_code,
        account_branch:     trainer.account_branch,
        bankDetailsComplete: !!(
          trainer.account_no &&
          trainer.ifsc_code  &&
          trainer.recipient_name
        ),
      },
      period:        { from: fromDate, to: toDate },
      totalSessions: inRange.length,
      totalEarnings,
      earnings:      inRange,
    };
  }
}