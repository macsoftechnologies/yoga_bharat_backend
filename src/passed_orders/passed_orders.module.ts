import { Module } from '@nestjs/common';
import { PassedOrdersService } from './passed_orders.service';
import { PassedOrdersController } from './passed_orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PassedOrders, passedOrderSchema } from './schema/passed_orders.schema';
import { Booking, bookingSchema } from 'src/booking/schema/booking.schema';
import { OrderAlert, orderAlertSchema } from 'src/booking/schema/order_alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PassedOrders.name, schema: passedOrderSchema },
      { name: Booking.name, schema: bookingSchema },
      { name: OrderAlert.name, schema: orderAlertSchema },
    ]),
  ],
  controllers: [PassedOrdersController],
  providers: [PassedOrdersService],
})
export class PassedOrdersModule {}
