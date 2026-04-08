import { Module } from '@nestjs/common';
import { SessionStatusService } from './session-status.service';
import { SessionStatusController } from './session-status.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SessionStatus,
  sessionStatusSchema,
} from './schema/session_status.schema';
import { Booking, bookingSchema } from 'src/booking/schema/booking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SessionStatus.name, schema: sessionStatusSchema },
      { name: Booking.name, schema: bookingSchema },
    ]),
  ],
  controllers: [SessionStatusController],
  providers: [SessionStatusService],
})
export class SessionStatusModule {}
