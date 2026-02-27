import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, bookingSchema } from './schema/booking.schema';
import { User, userSchema } from 'src/users/schema/user.schema';
import { Earning, earningSchema } from '../booking/schema/earnings.scheam';
import {
  YogaDetails,
  yogaDetailsSchema,
} from 'src/yoga/schema/yoga_details.schema';
import { MyEarnings, myEarningSchema } from './schema/myearnings.schema';
import {
  InAppNotifications,
  inappNotificationsSchema,
} from 'src/in-app-notifications/schema/inapp.schema';
import { SessionsService } from 'src/sessions/sessions.service';
import { InAppNotificationsService } from 'src/in-app-notifications/in-app-notifications.service';
import { RoomSessions, roomSessionSchema } from 'src/sessions/schema/sessions.schema';
import { OrderAlert, orderAlertSchema } from './schema/order_alert.schema';

@Module({
  imports: [
    
    MongooseModule.forFeature([
      { name: Booking.name, schema: bookingSchema },
      { name: User.name, schema: userSchema },
      { name: Earning.name, schema: earningSchema },
      { name: MyEarnings.name, schema: myEarningSchema },
      { name: YogaDetails.name, schema: yogaDetailsSchema },
      { name: InAppNotifications.name, schema: inappNotificationsSchema },
      { name: RoomSessions.name, schema: roomSessionSchema },
      { name: OrderAlert.name, schema: orderAlertSchema },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService, SessionsService, InAppNotificationsService],
})
export class BookingModule {}
