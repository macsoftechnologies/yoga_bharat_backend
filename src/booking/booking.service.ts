import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking } from './schema/booking.schema';
import { Model } from 'mongoose';
import { bookingDto } from './dto/booking.dto';
import { User } from 'src/users/schema/user.schema';
import { Earning } from '../booking/schema/earnings.scheam';
import { earningDto } from './dto/earnings.dto';
import { YogaDetails } from 'src/yoga/schema/yoga_details.schema';
import { MyEarnings } from './schema/myearnings.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Earning.name)
    private readonly earningModel: Model<Earning>,
    @InjectModel(YogaDetails.name)
    private readonly yogaModel: Model<YogaDetails>,
    @InjectModel(MyEarnings.name)
    private readonly myEarningModel: Model<MyEarnings>,
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
          data: addbooking,
        };
        //   }
        // if (addbooking && bookingTrainers.length) {
        //   await this.sendBookingNotificationToTrainers(
        //     bookingTrainers,
        //     addbooking,
        //   );
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

  // async sendBookingNotificationToTrainers(
  //   trainerIds: string[],
  //   booking: any,
  // ) {
  //   const tokens = await this.fcmTokenModel.find({
  //     userId: { $in: trainerIds },
  //   });

  //   if (!tokens.length) return;

  //   const messages = tokens.map((t) => ({
  //     token: t.fcmToken,
  //     notification: {
  //       title: 'New Booking Assigned 🧘',
  //       body: `Session on ${booking.scheduledDate.toDateString()} at ${booking.time}`,
  //     },
  //     data: {
  //       bookingId: booking._id.toString(),
  //       yogaId: booking.yogaId.toString(),
  //       clientId: booking.clientId.toString(),
  //       sessionId: booking.sessionId?.toString() || '',
  //       type: 'NEW_BOOKING',
  //     },
  //   }));

  //   const response = await admin.messaging().sendEach(messages);

  //   response.responses.forEach(async (res, index) => {
  //     if (!res.success) {
  //       const errorCode = res.error?.code;
  //       if (
  //         errorCode === 'messaging/registration-token-not-registered' ||
  //         errorCode === 'messaging/invalid-registration-token'
  //       ) {
  //         await this.fcmTokenModel.deleteOne({
  //           fcmToken: tokens[index].fcmToken,
  //         });
  //       }
  //     }
  //   });
  // }

  async getBookings(page: number, limit: number, filters: any) {
    try {
      const skip = (page - 1) * limit;

      const match: any = {};

      // 🔹 Basic Filters
      if (filters.bookingId) match.bookingId = filters.bookingId;
      if (filters.clientId) match.clientId = filters.clientId;
      if (filters.accepted_trainerId)
        match.accepted_trainerId = filters.accepted_trainerId;
      if (filters.status) {
        match.status = {
          $regex: new RegExp(filters.status, 'i'),
        };
      }
      if (filters.yogaId) match.yogaId = filters.yogaId;
      if (filters.time) match.time = filters.time;
      if (filters.bookingType) {
        match.bookingType = {
          $regex: new RegExp(filters.bookingType, 'i'),
        };
      }

      if (filters.scheduledDate) {
        const date = new Date(filters.scheduledDate);

        const options: Intl.DateTimeFormatOptions = { month: 'short' };
        const month = date.toLocaleString('en-US', options); // Feb
        const day = date.getDate();
        const year = date.getFullYear();

        const formattedDate = `${month} ${day} ${year}`;

        match.scheduledDate = {
          $regex: formattedDate,
          $options: 'i',
        };
      }

      const pipeline: any[] = [
        { $match: match },

        // 🔹 Lookups
        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: 'userId',
            as: 'clientId',
          },
        },
        { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: 'users',
            localField: 'accepted_trainerId',
            foreignField: 'userId',
            as: 'accepted_trainerId',
          },
        },
        {
          $unwind: {
            path: '$accepted_trainerId',
            preserveNullAndEmptyArrays: true,
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
        { $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true } },
      ];

      // 🔥 Name Filtering After Lookup
      const nameMatch: any = {};

      if (filters.clientName) {
        nameMatch['clientId.name'] = {
          $regex: filters.clientName,
          $options: 'i',
        };
      }

      if (filters.trainerName) {
        nameMatch['accepted_trainerId.name'] = {
          $regex: filters.trainerName,
          $options: 'i',
        };
      }

      if (filters.yogaName) {
        nameMatch['yogaId.yoga_name'] = {
          $regex: filters.yogaName,
          $options: 'i',
        };
      }

      if (Object.keys(nameMatch).length > 0) {
        pipeline.push({ $match: nameMatch });
      }

      // 🔹 Sort
      pipeline.push({ $sort: { createdAt: -1 } });

      // 🔹 Pagination using $facet (Professional way)
      pipeline.push({
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      });

      const result = await this.bookingModel.aggregate(pipeline);

      const bookings = result[0].data;
      const totalCount = result[0].totalCount[0]?.count || 0;

      return {
        statusCode: 200,
        message: 'List of Bookings',
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        data: bookings,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: error.message || error,
      };
    }
  }

  async deleteBooking(req: bookingDto) {
    try {
      const remove = await this.bookingModel.deleteOne({
        bookingId: req.bookingId,
      });
      if (remove) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Booking Deleted Successfully',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async acceptBooking(req: bookingDto) {
    try {
      const accept = await this.bookingModel.updateOne(
        { bookingId: req.bookingId },
        {
          $set: {
            accepted_trainerId: req.accepted_trainerId,
            status: 'accepted',
          },
        },
      );
      if (accept) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Booking accepted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to accept booking.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async addEarning(req: earningDto) {
    try {
      const findEarning = await this.earningModel.find({
        bookingId: req.bookingId,
      });
      if (findEarning.length > 0) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Earning already added for this Booking.',
          data: findEarning,
        };
      }
      const findBooking = await this.bookingModel.findOne({
        bookingId: req.bookingId,
      });
      if (findBooking) {
        const findYoga = await this.yogaModel.findOne({
          yogaId: findBooking.yogaId,
        });
        if (findYoga) {
          const addEarning = await this.earningModel.create({
            bookingId: req.bookingId,
            trainerId: findBooking.accepted_trainerId,
            earned_amount: findYoga.trainer_price,
            clientId: findBooking.clientId,
            yogaId: findBooking.yogaId,
            date: findBooking.scheduledDate,
          });
          if (addEarning) {
            const earnedAmount =
              parseInt(findYoga.client_price) -
              parseInt(findYoga.trainer_price);
            const addmyEarning = await this.myEarningModel.create({
              learner_id: findBooking.clientId,
              trainer_id: findBooking.accepted_trainerId,
              earned_amount: earnedAmount,
              date: findBooking.scheduledDate,
              bookingId: req.bookingId,
              yogaId: findBooking.yogaId,
            });
            return {
              statusCode: HttpStatus.OK,
              message: 'Earning added successfully',
              data: addEarning,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to add earning',
            };
          }
        } else {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Yoga Details not found',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Booking not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getEarnings(req: earningDto) {
    try {
      const result = await this.earningModel.aggregate([
        { $match: { trainerId: req.trainerId } },
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
            from: 'yogadetails',
            localField: 'yogaId',
            foreignField: 'yogaId',
            as: 'yogaId',
          },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } }, // optional
            ],
            total: [
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$earned_amount' },
                },
              },
            ],
          },
        },
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'Earnings of Trainer',
        Total: result[0]?.total[0]?.totalAmount || 0,
        data: result[0]?.data || [],
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getCurrentMonthEarnings(req: earningDto) {
    try {
      const now = new Date();

      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const result = await this.earningModel.aggregate([
        {
          $match: {
            trainerId: req.trainerId,
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
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
            from: 'yogadetails',
            localField: 'yogaId',
            foreignField: 'yogaId',
            as: 'yogaId',
          },
        },
        {
          $facet: {
            data: [{ $sort: { createdAt: -1 } }],
            total: [
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$earned_amount' },
                },
              },
            ],
          },
        },
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'Current Month Earnings of Trainer',
        Total: result[0]?.total[0]?.totalAmount || 0,
        data: result[0]?.data || [],
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
