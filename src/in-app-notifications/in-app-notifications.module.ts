import { Module } from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { InAppNotificationsController } from './in-app-notifications.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InAppNotifications,
  inappNotificationsSchema,
} from './schema/inapp.schema';
import { User, userSchema } from 'src/users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InAppNotifications.name, schema: inappNotificationsSchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [InAppNotificationsController],
  providers: [InAppNotificationsService],
})
export class InAppNotificationsModule {}
