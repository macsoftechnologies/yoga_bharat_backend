import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminPaymentCyclesController, TrainerPaymentCyclesController, WebhookController } from './payment_cycle.controller';
import { PaymentCycle, paymentCycleSchema } from './schema/payment_cycle.schema';
import { Earning, earningSchema } from 'src/booking/schema/earnings.scheam';
import { User, userSchema } from 'src/users/schema/user.schema';
import { PaymentCyclesService } from './payment_cycle.service';
import { RazorpayService } from 'src/auth/razorpay.service';
import { YogaDetails, yogaDetailsSchema } from 'src/yoga/schema/yoga_details.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentCycle.name, schema: paymentCycleSchema },
      { name: Earning.name,      schema: earningSchema      },
      { name: User.name,         schema: userSchema         },
      { name: YogaDetails.name,  schema: yogaDetailsSchema         },
    ]),
  ],
  controllers: [
    AdminPaymentCyclesController,
    TrainerPaymentCyclesController,
    WebhookController,
  ],
  providers: [
    PaymentCyclesService,
    RazorpayService,
  ],
  exports: [PaymentCyclesService],
})
export class PaymentCyclesModule {}