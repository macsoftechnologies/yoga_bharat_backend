import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomSessions, roomSessionSchema } from './schema/sessions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomSessions.name, schema: roomSessionSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
