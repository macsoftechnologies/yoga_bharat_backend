import { Module } from '@nestjs/common';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Terms, termsSchema } from './schema/terms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Terms.name, schema: termsSchema }]),
  ],
  controllers: [TermsController],
  providers: [TermsService, AuthService, JwtService],
})
export class TermsModule {}
