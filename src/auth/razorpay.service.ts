import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly config: ConfigService) {}

  // ── Step 1: Create Razorpay Contact ─────────────────────
  async createContact(payload: {
    name: string;
    email: string;
    contact: string;
    referenceId: string;
  }): Promise<any> {
    const res = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.basicAuth(),
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        contact: payload.contact,
        type: 'vendor',
        reference_id: payload.referenceId,
      }),
    });

    const data = await res.json();
    if (data.error) {
      this.logger.error('createContact failed', data.error);
      throw new BadRequestException(
        data.error.description || 'Failed to create Razorpay contact',
      );
    }
    this.logger.log(`Contact created: ${data.id} for ${payload.name}`);
    return data;
  }

  // ── Step 2: Create Fund Account (trainer's bank account) ─
  async createFundAccount(payload: {
    contactId: string;
    recipientName: string;
    accountNo: string;
    ifscCode: string;
  }): Promise<any> {
    const res = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.basicAuth(),
      },
      body: JSON.stringify({
        contact_id: payload.contactId,
        account_type: 'bank_account',
        bank_account: {
          name: payload.recipientName,
          ifsc: payload.ifscCode,
          account_number: payload.accountNo,
        },
      }),
    });

    const data = await res.json();
    if (data.error) {
      this.logger.error('createFundAccount failed', data.error);
      throw new BadRequestException(
        data.error.description || 'Failed to create fund account',
      );
    }
    this.logger.log(`Fund account created: ${data.id}`);
    return data;
  }

  // ── Step 3: Initiate Payout ──────────────────────────────
  // async createPayout(payload: {
  //   fundAccountId: string;
  //   amountRupees: number;
  //   cycleId: string;
  //   trainerName: string;
  //   mode?: 'NEFT' | 'IMPS' | 'RTGS';
  // }): Promise<any> {
  //   const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  //   if (!accountNumber) {
  //     throw new BadRequestException(
  //       'RAZORPAYX_ACCOUNT_NUMBER is not set in .env',
  //     );
  //   }

  //   const res = await fetch('https://api.razorpay.com/v1/payouts', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Payout-Idempotency': `cycle_${payload.cycleId}`, // prevents duplicate payouts
  //       Authorization: this.basicAuth(),
  //     },
  //     body: JSON.stringify({
  //       account_number: accountNumber,
  //       fund_account_id: payload.fundAccountId,
  //       amount: Math.round(payload.amountRupees * 100), // paise
  //       currency: 'INR',
  //       mode: payload.mode || 'IMPS',
  //       purpose: 'payout',
  //       queue_if_low_balance: true,
  //       reference_id: `cycle_${payload.cycleId}`,
  //       narration: `Weekly settlement ${payload.trainerName}`,
  //     }),
  //   });

  //   const data = await res.json();
  //   if (data.error) {
  //     this.logger.error('createPayout failed', data.error);
  //     throw new BadRequestException(
  //       data.error.description || 'Razorpay payout failed',
  //     );
  //   }
  //   this.logger.log(
  //     `Payout initiated: ${data.id} | ₹${payload.amountRupees} → ${payload.trainerName} | Status: ${data.status}`,
  //   );
  //   return data;
  // }

  async createPayout(payload: {
    fundAccountId: string;
    amountRupees: number;
    cycleId: string;
    trainerName: string;
    mode?: 'NEFT' | 'IMPS' | 'RTGS';
  }): Promise<any> {
    const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

    const res = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': `cycle_${payload.cycleId}`,
        Authorization: this.basicAuth(),
      },
      body: JSON.stringify({
        account_number: accountNumber,
        fund_account_id: payload.fundAccountId,
        amount: Math.round(payload.amountRupees * 100),
        currency: 'INR',
        mode: payload.mode || 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `cycle_${payload.cycleId}`,
        narration: `Weekly settlement ${payload.trainerName}`,
      }),
    });

    const data = await res.json();

    // ✅ Correct check
    if (!res.ok) {
      this.logger.error('createPayout failed', data);
      throw new BadRequestException(
        data?.error?.description || 'Razorpay payout failed',
      );
    }

    this.logger.log(`Payout SUCCESS: ${data.id} | Status: ${data.status}`);

    return data;
  }

  // ── Fetch payout status (for manual polling) ─────────────
  // async getPayoutStatus(payoutId: string): Promise<any> {
  //   const res = await fetch(`https://api.razorpay.com/v1/payouts/${payoutId}`, {
  //     headers: { Authorization: this.basicAuth() },
  //   });
  //   const data = await res.json();
  //   if (data.error) {
  //     throw new BadRequestException(
  //       data.error.description || 'Failed to fetch payout',
  //     );
  //   }
  //   return data;
  // }
  async getPayoutStatus(payoutId: string): Promise<any> {
    const res = await fetch(`https://api.razorpay.com/v1/payouts/${payoutId}`, {
      headers: { Authorization: this.basicAuth() },
    });

    const data = await res.json();

    // ✅ Correct way
    if (!res.ok) {
      throw new BadRequestException(
        data?.error?.description || 'Failed to fetch payout',
      );
    }

    // Optional debug
    this.logger.log(`Payout Fetch SUCCESS: ${payoutId} → ${data.status}`);

    return data;
  }

  // ── Verify Razorpay webhook signature ────────────────────
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException(
        'RAZORPAY_WEBHOOK_SECRET is not set in .env',
      );
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }

  private basicAuth(): string {
    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  }
}
