import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking } from './schema/booking.schema';
import { Model } from 'mongoose';
import { bookingDto } from './dto/booking.dto';
import { User } from 'src/users/schema/user.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private formatTimeToHHMMSS(time: string): string {
    // Accepts: "HH:mm", "HH:mm:ss"
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

    const match = time.match(timeRegex);
    if (!match) {
      throw new BadRequestException('Time must be in HH:mm or HH:mm:ss format');
    }

    const hours = match[1];
    const minutes = match[2];
    const seconds = match[3] ?? '00';

    return `${hours}:${minutes}:${seconds}`;
  }

  async createBooking(req: bookingDto) {
    try {
      const trainers = await this.userModel.find({
        professional_details: req.yogaId,
      });
      const bookingTrainers = trainers.map((trainer) => trainer.userId);
      const sAt = new Date(req.scheduledDate);
      const formattedTime = this.formatTimeToHHMMSS(req.time);
      const addbooking = await this.bookingModel.create({
        bookingType: req.bookingType,
        languageId: req.languageId,
        yogaId: req.yogaId,
        clientId: req.clientId,
        scheduledDate: sAt,
        time: formattedTime,
        package_details: req.package_details,
        sessionId: req.sessionId,
        transactionId: req.transactionId,
        trainerIds: bookingTrainers,
      });
      if (addbooking) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Booking created successfully.',
          data: addbooking
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to create booking.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getBookings(
    page: number,
    limit: number,
    filters: {
      clientId?: string;
      accepted_trainerId?: string;
      status?: string;
      yogaId?: string;
      bookingId: string;
    },
  ) {
    try {
      const skip = (page - 1) * limit;

      // 🔹 Build dynamic match object
      const match: any = {};

      if (filters.bookingId) {
        match.bookingId = filters.bookingId;
      }

      if (filters.clientId) {
        match.clientId = filters.clientId;
      }

      if (filters.accepted_trainerId) {
        match.accepted_trainerId = filters.accepted_trainerId;
      }

      if (filters.status) {
        match.status = filters.status;
      }

      if (filters.yogaId) {
        match.yogaId = filters.yogaId;
      }

      // 🔹 Count total documents with filters
      const totalCount = await this.bookingModel.countDocuments(match);

      const bookings = await this.bookingModel.aggregate([
        { $match: match },

        {
          $lookup: {
            from: 'languages',
            localField: 'languageId',
            foreignField: 'languageId',
            as: 'languageId',
          },
        },
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'yogaId',
            foreignField: 'yogaId',
            as: 'yogaId',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: 'userId',
            as: 'clientId',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'accepted_trainerId',
            foreignField: 'userId',
            as: 'accepted_trainerId',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'trainerIds',
            foreignField: 'userId',
            as: 'trainerIds',
          },
        },
        {
          $lookup: {
            from: 'sessions',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'sessionId',
          },
        },
        {
          $lookup: {
            from: 'transactions',
            localField: 'transactionId',
            foreignField: 'transactionId',
            as: 'transactionId',
          },
        },

        { $skip: skip },
        { $limit: limit },
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'List of Bookings',
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        data: bookings,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || error,
      };
    }
  }

  async deleteBooking(req: bookingDto) {
    try{
      const remove = await this.bookingModel.deleteOne({bookingId: req.bookingId});
      if(remove) {
        return {
          statusCode: HttpStatus.OK,
          message: "Booking Deleted Successfully",
        }
      }
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  async acceptBooking(req: bookingDto) {
    try{
      const accept = await this.bookingModel.updateOne({bookingId: req.bookingId},{
        $set: {
          accepted_trainerId: req.accepted_trainerId,
          status: "accepted",
        }
      });
      if(accept) {
        return {
          statusCode: HttpStatus.OK,
          message: "Booking accepted successfully",
        }
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: "Failed to accept booking."
        }
      }
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      }
    }
  }
}
