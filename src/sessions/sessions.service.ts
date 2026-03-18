import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RoomSessions } from './schema/sessions.schema';
import { Model } from 'mongoose';
import { sessionRoomsDto } from './dto/sessions.dto';
import { Booking } from 'src/booking/schema/booking.schema';
import { OrderAlert } from 'src/booking/schema/order_alert.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(RoomSessions.name)
    private readonly roomSessionModel: Model<RoomSessions>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
    @InjectModel(OrderAlert.name)
    private readonly orderAlertModel: Model<OrderAlert>,
  ) {}

  async addroomsession(req: Partial<sessionRoomsDto>) {
    try {
      const addsession = await this.roomSessionModel.create(req);
      if (addsession) {
        const availableTrainerIds = await this.bookingModel.findOne({
          bookingId: req.bookingId,
        });
        availableTrainerIds?.trainerIds.map(async (trainer) => {
          await this.orderAlertModel.create({
            ...req,
            bookingId: availableTrainerIds?.bookingId,
            clientId: availableTrainerIds.clientId,
            trainerId: trainer,
            yogaId: availableTrainerIds.yogaId,
          });
        });
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
