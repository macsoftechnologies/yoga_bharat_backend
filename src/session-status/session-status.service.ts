import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SessionStatus } from './schema/session_status.schema';
import { Model } from 'mongoose';
import { sessionStatusDto } from './dto/session_status.dto';
import { Booking } from 'src/booking/schema/booking.schema';

@Injectable()
export class SessionStatusService {
  constructor(
    @InjectModel(SessionStatus.name)
    private readonly sessionStatusModel: Model<SessionStatus>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
  ) {}

  async createSessionStatus(req: Partial<sessionStatusDto>) {
    try {
      const addstatus = await this.sessionStatusModel.create(req);
      if (addstatus) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Session Status added successfully',
          data: addstatus,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'failed to add',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
      };
    }
  }

  async updateSessionStatus(req: sessionStatusDto) {
    try {
      const updatesession = await this.sessionStatusModel.updateOne(
        { bookingId: req.bookingId },
        {
          $set: {
            trainer_joined_status: req.trainer_joined_status,
            client_joined_status: req.client_joined_status,
          },
        },
      );
      if (updatesession.modifiedCount > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Session Status Updated Successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'failed to update',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
      };
    }
  }

  async getDetails(req: sessionStatusDto) {
    try {
      const getdetails = await this.sessionStatusModel
        .findOne({ clientId: req.clientId })
        .sort({ created: -1 });
      const getBookingStatus = await this.bookingModel.findOne({
        bookingId: getdetails?.bookingId,
      });
      if (
        getdetails &&
        (getBookingStatus?.status != 'completed' || 'cancelled')
      ) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Session status details',
          data: getdetails,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No session status found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
      };
    }
  }
}
