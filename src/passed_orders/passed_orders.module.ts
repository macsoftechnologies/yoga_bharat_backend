import { Module } from '@nestjs/common';
import { PassedOrdersService } from './passed_orders.service';
import { PassedOrdersController } from './passed_orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PassedOrders, passedOrderSchema } from './schema/passed_orders.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PassedOrders.name, schema: passedOrderSchema },
    ]),
  ],
  controllers: [PassedOrdersController],
  providers: [PassedOrdersService],
})
export class PassedOrdersModule {}
