import { Module } from '@nestjs/common';
import { YogaService } from './yoga.service';
import { YogaController } from './yoga.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { YogaDetails, yogaDetailsSchema } from './schema/yoga_details.schema';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: YogaDetails.name, schema: yogaDetailsSchema },
    ]),
  ],
  controllers: [YogaController],
  providers: [YogaService, AuthService, JwtService],
})
export class YogaModule {}
