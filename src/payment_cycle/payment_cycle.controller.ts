import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentCyclesService } from './payment_cycle.service';
import { RazorpayService } from 'src/auth/razorpay.service';
import { CycleWithEarningsResponse } from './dto/payment_cycle.dto';

// ─── DTOs ─────────────────────────────────────────────────────

export class ApproveCycleDto {
  note?: string;
}

export class RejectCycleDto {
  reason: string;
}

export class ManualCycleDto {
  trainerId: string;
  fromDate?: string; // "2025-12-25"
  toDate?: string; // "2025-12-31"
}

/**
 * Used by POST /:id/mark-paid
 * Admin confirms they have transferred the payment outside the system.
 */
export class MarkPaidDto {
  paymentMethod: string;
  transactionRef?: string;
  note?: string;
}

// ─── ADMIN Controller ──────────────────────────────────────────

@Controller('admin/payment-cycles')
// // @UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentCyclesController {
  constructor(private readonly cyclesService: PaymentCyclesService) {}

  /** GET /admin/payment-cycles/dashboard */
  @Get('dashboard')
  getDashboard() {
    return this.cyclesService.getDashboardStats();
  }

  /**
   * GET /admin/payment-cycles
   * ?status=pending_review&trainerId=xxx&page=1&limit=10
   */
  @Get()
  getAllCycles(
    @Query('status') status?: string,
    @Query('trainerId') trainerId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('isExport') isExport?: boolean,
  ) {
    return this.cyclesService.getAllCycles({
      status,
      trainerId,
      page: parseInt(page),
      limit: parseInt(limit),
      isExport,
    });
  }

  /**
   * GET /admin/payment-cycles/preview
   * ?trainerId=xxx&fromDate=2025-12-25&toDate=2025-12-31
   * Preview a trainer's unsettled earnings before creating a manual cycle
   */
  @Get('preview')
  previewEarnings(
    @Query('trainerId') trainerId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.cyclesService.previewEarnings(trainerId, fromDate, toDate);
  }

  /** GET /admin/payment-cycles/:id */
  @Get(':id')
  getCycle(@Param('id') id: string) {
    return this.cyclesService.getCycleById(id);
  }

  /** GET /admin/payment-cycles/:id/earnings */
  @Get(':id/earnings')
  getCycleEarnings(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<CycleWithEarningsResponse> {
    return this.cyclesService.getCycleWithEarnings(id, {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
    });
  }

  /**
   * PATCH /admin/payment-cycles/:id/approve
   * Body: { note?: string }
   * Validates: account_no, ifsc_code, recipient_name must exist
   */
  @Patch(':id/approve')
  approveCycle(
    @Param('id') id: string,
    @Body() body: ApproveCycleDto,
    @Req() req: any,
  ) {
    const adminId = req.user?._id || req.user?.userId || 'admin';
    return this.cyclesService.approveCycle(id, adminId, body.note);
  }

  /**
   * PATCH /admin/payment-cycles/:id/reject
   * Body: { reason: string }
   * Earnings revert to unsettled → picked up next cycle
   */
  @Patch(':id/reject')
  rejectCycle(
    @Param('id') id: string,
    @Body() body: RejectCycleDto,
    @Req() req: any,
  ) {
    const adminId = req.user?._id || req.user?.userId || 'admin';
    return this.cyclesService.rejectCycle(id, adminId, body.reason);
  }

  /**
   * POST /admin/payment-cycles/:id/mark-paid
   * Body: { paymentMethod: string, transactionRef?: string, note?: string }
   *
   * Admin manually confirms payment was sent outside the system
   * (bank transfer, UPI, NEFT, etc.).
   * Cycle must be in 'approved' status.
   * Marks cycle → 'paid' and all linked earnings → 'settled'.
   */
  @Post(':id/mark-paid')
  markCycleAsPaid(
    @Param('id') id: string,
    @Body() body: MarkPaidDto,
    @Req() req: any,
  ) {
    const adminId = req.user?._id || req.user?.userId || 'admin';
    return this.cyclesService.markCycleAsPaid(id, adminId, {
      paymentMethod: body.paymentMethod,
      transactionRef: body.transactionRef,
      note: body.note,
    });
  }

  // ──────────────────────────────────────────────────────────
  // ⚠️  RAZORPAY AUTOMATIC PAYOUT — DISABLED
  //     Uncomment when ready to re-enable Razorpay payouts.
  //     Also uncomment initiatePayout() in the service.
  // ──────────────────────────────────────────────────────────
  /**
   * POST /admin/payment-cycles/:id/payout
   * Triggers Razorpay payout to trainer's bank account
   * Pays full totalEarnings (no deductions)
   * Only works when status === 'approved'
   */
  // @Post(':id/payout')
  // initiatePayout(@Param('id') id: string) {
  //   return this.cyclesService.initiatePayout(id);
  // }

  /**
   * GET /admin/payment-cycles/:id/payout-status
   * Poll Razorpay and sync latest payout status to DB
   * ⚠️  Only useful once Razorpay payouts are re-enabled.
   */
  // @Get(':id/payout-status')
  // syncPayoutStatus(@Param('id') id: string) {
  //   return this.cyclesService.syncPayoutStatus(id);
  // }

  /**
   * POST /admin/payment-cycles/manual-cycle
   * Body: { trainerId, fromDate?, toDate? }
   */
  @Post('manual-cycle')
  manualCreateCycle(@Body() body: ManualCycleDto) {
    return this.cyclesService.manualCreateCycle(
      body.trainerId,
      body.fromDate,
      body.toDate,
    );
  }

  /**
   * POST /admin/payment-cycles/trigger-weekly-job
   * Manually trigger the Sunday cron (for testing)
   */
  @Post('trigger-weekly-job')
  triggerWeeklyJob() {
    return this.cyclesService.generateCyclesForAllTrainers();
  }
}

// ─── WEBHOOK Controller ────────────────────────────────────────

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly cyclesService: PaymentCyclesService,
    private readonly razorpayService: RazorpayService,
  ) {}

  /**
   * POST /webhooks/razorpay
   * Register in Razorpay Dashboard → Settings → Webhooks
   * Enable events: payout.processed, payout.rejected, payout.cancelled
   *
   * ⚠️  Currently only handles webhook events if a Razorpay payout was
   *     somehow initiated externally. Automatic payouts are disabled.
   *     Webhook stays active so it works immediately when re-enabled.
   */
  // @Post('razorpay')
  // @HttpCode(HttpStatus.OK)
  // async handleWebhook(
  //   @Req() req: Request,
  //   @Headers('x-razorpay-signature') signature: string,
  // ) {
  //   const rawBody = (req as any).rawBody?.toString() || JSON.stringify(req.body);
  //   const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);

  //   if (!isValid) return { status: 'invalid_signature' };

  //   const event   = req.body as any;
  //   const eventId = event.event as string;

  //   if (eventId === 'payout.processed') {
  //     const payout = event.payload.payout.entity;
  //     await this.cyclesService.handlePayoutProcessed(payout.id);
  //   }

  //   if (eventId === 'payout.rejected' || eventId === 'payout.cancelled') {
  //     const payout = event.payload.payout.entity;
  //     await this.cyclesService.handlePayoutFailed(
  //       payout.id,
  //       payout.error_message || eventId,
  //     );
  //   }

  //   return { status: 'ok' };
  // }
}

// ─── TRAINER Controller ────────────────────────────────────────

@Controller('trainer/payment-cycles')
// // @UseGuards(JwtAuthGuard)
export class TrainerPaymentCyclesController {
  constructor(private readonly cyclesService: PaymentCyclesService) {}

  /** GET /trainer/payment-cycles */
  @Get()
  getMyCycles(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const trainerId = req.user?.userId || req.user?.trainerId;
    return this.cyclesService.getAllCycles({
      trainerId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  /** GET /trainer/payment-cycles/:id */
  @Get(':id')
  getCycle(@Param('id') id: string) {
    return this.cyclesService.getCycleById(id);
  }

  /** GET /trainer/payment-cycles/:id/earnings */
  @Get(':id/earnings')
  getCycleEarnings(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<CycleWithEarningsResponse> {
    return this.cyclesService.getCycleWithEarnings(id, {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
    });
  }
}
