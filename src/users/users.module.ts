import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schema/user.schema';
import {
  HealthPreference,
  healthPreferenceSchema,
} from './schema/health_preference.schema';
import {
  ProfessionalDetails,
  professionalDetailsSchema,
} from './schema/professional_details.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Certificate, certificateSchema } from './schema/cerificates.schema';
import { InAppNotifications, inappNotificationsSchema } from 'src/in-app-notifications/schema/inapp.schema';
import { InAppNotificationsService } from 'src/in-app-notifications/in-app-notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: HealthPreference.name, schema: healthPreferenceSchema },
      { name: ProfessionalDetails.name, schema: professionalDetailsSchema },
      { name: Certificate.name, schema: certificateSchema },
      { name: InAppNotifications.name, schema: inappNotificationsSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService, JwtService, InAppNotificationsService],
})
export class UsersModule {}
