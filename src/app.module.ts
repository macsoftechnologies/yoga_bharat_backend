import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './auth/guards/roles.guard';

import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { YogaModule } from './yoga/yoga.module';
import { LanguageModule } from './language/language.module';
import { SplashScreenModule } from './splash_screen/splash_screen.module';
import { PrivacyModule } from './privacy/privacy.module';
import { TermsModule } from './terms/terms.module';
import { BookingModule } from './booking/booking.module';
import { FeaturesModule } from './features/features.module';
import { ApptutorialModule } from './apptutorial/apptutorial.module';
import { CallbackModule } from './callback/callback.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SessionsModule } from './sessions/sessions.module';
import { InAppNotificationsModule } from './in-app-notifications/in-app-notifications.module';

@Module({
  imports: [
    // ✅ LOAD CONFIG FIRST
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // ✅ THEN use ConfigService
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
      }),
    }),

    AuthModule,
    AdminModule,
    UsersModule,
    YogaModule,
    LanguageModule,
    SplashScreenModule,
    PrivacyModule,
    TermsModule,
    BookingModule,
    FeaturesModule,
    ApptutorialModule,
    CallbackModule,
    forwardRef(() => TicketsModule),
    NotificationsModule,
    SessionsModule,
    InAppNotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
