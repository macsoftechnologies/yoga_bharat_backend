import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { fcmSchema, FCMTokens } from './schema/fcm.schema';
import {
  Notifications,
  notificationsSchema,
} from './schema/notifications.schema';
import { User, userSchema } from 'src/users/schema/user.schema';
import { SMSService } from 'src/auth/sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FCMTokens.name, schema: fcmSchema },
      { name: Notifications.name, schema: notificationsSchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, SMSService],
})
export class NotificationsModule {}
