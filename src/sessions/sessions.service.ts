import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RoomSessions } from './schema/sessions.schema';
import { Model } from 'mongoose';
import { sessionRoomsDto } from './dto/sessions.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(RoomSessions.name)
    private readonly roomSessionModel: Model<RoomSessions>,
  ) {}

  async addroomsession(req: Partial<sessionRoomsDto>) {
    try {
      const addsession = await this.roomSessionModel.create(req);
      if (addsession) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Room Details added successfully',
          data: addsession,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
