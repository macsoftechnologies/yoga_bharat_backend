import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomSessions, roomSessionSchema } from './schema/sessions.schema';
import { SessionStatus, sessionStatusSchema } from 'src/session-status/schema/session_status.schema';
import { Booking, bookingSchema } from 'src/booking/schema/booking.schema';
import { SessionStatusService } from 'src/session-status/session-status.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomSessions.name, schema: roomSessionSchema },
      { name: SessionStatus.name, schema: sessionStatusSchema },
      { name: Booking.name, schema: bookingSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionStatusService],
})
export class SessionsModule {}
