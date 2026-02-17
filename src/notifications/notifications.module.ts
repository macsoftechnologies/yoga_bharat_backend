import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { fcmSchema, FCMTokens } from './schema/fcm.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: FCMTokens.name, schema: fcmSchema}])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
