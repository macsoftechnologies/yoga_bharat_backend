import { Module } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageController } from './language.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Language, languageSchema } from './schema/language.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forFeature([{name: Language.name, schema: languageSchema}])],
  controllers: [LanguageController],
  providers: [LanguageService, AuthService, JwtService],
})
export class LanguageModule {}
