import { Module } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { CallbackController } from './callback.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CallRequest, callRequestSchema } from './schema/callback.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: CallRequest.name, schema: callRequestSchema}])],
  controllers: [CallbackController],
  providers: [CallbackService],
})
export class CallbackModule {}
