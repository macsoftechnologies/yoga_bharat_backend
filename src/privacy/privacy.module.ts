import { Module } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Privacy, privacySchema } from './schema/privacy.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Privacy.name, schema: privacySchema }]),
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService, AuthService, JwtService],
})
export class PrivacyModule {}
