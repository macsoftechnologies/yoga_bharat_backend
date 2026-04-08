import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RoomSessions } from './schema/sessions.schema';
import { Model } from 'mongoose';
import { sessionRoomsDto } from './dto/sessions.dto';
import { Booking } from 'src/booking/schema/booking.schema';
import { OrderAlert } from 'src/booking/schema/order_alert.schema';
import { SessionStatusService } from 'src/session-status/session-status.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(RoomSessions.name)
    private readonly roomSessionModel: Model<RoomSessions>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
    private readonly sessionStatusService: SessionStatusService,
  ) {}

  async addroomsession(req: Partial<sessionRoomsDto>) {
    try {
      const addsession = await this.roomSessionModel.create(req);
      if (addsession) {
        const findBooking = await this.bookingModel.findOne({
          bookingId: req.bookingId,
        });
        if (findBooking) {
          const currentDate = new Date();
          await this.sessionStatusService.createSessionStatus({
            trainerId: findBooking?.accepted_trainerId,
            clientId: findBooking?.clientId,
            date: currentDate.toISOString().split('T')[0],
            time: currentDate.toTimeString().split(' ')[0],
            bookingId: findBooking?.bookingId,
          });
        }
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
