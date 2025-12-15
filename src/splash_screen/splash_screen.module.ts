import { Module } from '@nestjs/common';
import { SplashScreenService } from './splash_screen.service';
import { SplashScreenController } from './splash_screen.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import {
  SplashScreen,
  splashScreenSchema,
} from './schema/splash_screen.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SplashScreen.name, schema: splashScreenSchema },
    ]),
  ],

  controllers: [SplashScreenController],
  providers: [SplashScreenService, AuthService, JwtService],
})
export class SplashScreenModule {}
