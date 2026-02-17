import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Booking } from './schema/booking.schema';
import { Model, PipelineStage } from 'mongoose';
import { bookingDto } from './dto/booking.dto';
import { User } from 'src/users/schema/user.schema';
import { Earning } from '../booking/schema/earnings.scheam';
import { earningDto } from './dto/earnings.dto';
import { YogaDetails } from 'src/yoga/schema/yoga_details.schema';
import { MyEarnings } from './schema/myearnings.schema';
import { MonthlyBookingStatsDto } from './dto/monthlybooking.dto';
import { MonthlyEarningStatsDto } from './dto/monthlymyearning.dto';
import { YogaBookingStatsDto } from './dto/yogabookings.dto';
import { DashboardStatsDto } from './dto/Dashboardstats.dto';

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

      if (filters.fromDate || filters.toDate) {
        const datePatterns: string[] = [];

        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;

        const formatDate = (date: Date): string => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];

          const dayName = days[date.getDay()];
          const monthName = months[date.getMonth()];
          const day = date.getDate();
          const year = date.getFullYear();

          return `${dayName} ${monthName} ${day} ${year}`;
        };

        if (fromDate && toDate) {
          const current = new Date(fromDate);
          while (current <= toDate) {
            const dateStr = formatDate(current);
            datePatterns.push(dateStr);
            current.setDate(current.getDate() + 1);
          }
        } else if (fromDate) {
          const current = new Date(fromDate);
          const endDate = new Date(fromDate);
          endDate.setDate(endDate.getDate() + 365);

          while (current <= endDate) {
            const dateStr = formatDate(current);
            datePatterns.push(dateStr);
            current.setDate(current.getDate() + 1);
          }
        } else if (toDate) {
          const current = new Date(toDate);
          current.setDate(current.getDate() - 365);
          const endDate = new Date(toDate);

          while (current <= endDate) {
            const dateStr = formatDate(current);
            datePatterns.push(dateStr);
            current.setDate(current.getDate() + 1);
          }
        }

        if (datePatterns.length > 0) {
          const regexPattern = datePatterns.join('|');
          match.scheduledDate = {
            $regex: new RegExp(regexPattern, 'i'),
          };
        }
      }

      if (filters.scheduledDate && !filters.fromDate && !filters.toDate) {
        const date = new Date(filters.scheduledDate);

        const options: Intl.DateTimeFormatOptions = { month: 'short' };
        const month = date.toLocaleString('en-US', options);
        const day = date.getDate();
        const year = date.getFullYear();

        const formattedDate = `${month} ${day} ${year}`;

        match.scheduledDate = {
          $regex: formattedDate,
          $options: 'i',
        };
      }

      const pipeline: any[] = [{ $match: match }];

      pipeline.push(
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
        {
          $lookup: {
            from: 'languages',
            localField: 'languageId',
            foreignField: 'languageId',
            as: 'languageId',
          },
        },
        { $unwind: { path: '$languageId', preserveNullAndEmptyArrays: true } },
      );

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

      pipeline.push({ $sort: { createdAt: -1 } });

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
      console.error('Error in getBookings:', error);
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

  async getMonthlyBookingStats(
    year?: number,
  ): Promise<MonthlyBookingStatsDto[]> {
    const currentYear = year || new Date().getFullYear();

    const bookings = await this.bookingModel
      .find({
        scheduledDate: { $exists: true, $ne: null },
      })
      .lean()
      .exec();

    const monthCounts: { [key: number]: number } = {};

    bookings.forEach((booking: any) => {
      if (booking.scheduledDate && booking.scheduledDate !== '') {
        const date = new Date(booking.scheduledDate);

        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
          const month = date.getMonth() + 1; // 1-12
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        }
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const results: MonthlyBookingStatsDto[] = monthNames.map(
      (monthName, index) => ({
        month: monthName,
        bookingCount: monthCounts[index + 1] || 0,
        year: currentYear,
      }),
    );

    return results;
  }

  async getMonthlyEarningsStats(
    year?: number,
  ): Promise<MonthlyEarningStatsDto[]> {
    const currentYear = year || new Date().getFullYear();

    const earnings = await this.myEarningModel
      .find({
        date: { $exists: true, $ne: null },
      })
      .lean()
      .exec();

    const monthData: { [key: number]: { count: number; total: number } } = {};

    earnings.forEach((earning: any) => {
      if (earning.date && earning.date !== '') {
        const date = new Date(earning.date);

        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
          const month = date.getMonth() + 1; // 1-12

          if (!monthData[month]) {
            monthData[month] = { count: 0, total: 0 };
          }

          monthData[month].count += 1;

          const amount = parseFloat(earning.earned_amount) || 0;
          monthData[month].total += amount;
        }
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const results: MonthlyEarningStatsDto[] = monthNames.map(
      (monthName, index) => ({
        month: monthName,
        earningCount: monthData[index + 1]?.count || 0,
        totalAmount: monthData[index + 1]?.total || 0,
        year: currentYear,
      }),
    );

    return results;
  }

  async getYogaBookingStats(): Promise<YogaBookingStatsDto[]> {
    // Fetch all bookings that have a yogaId
    const bookings = await this.bookingModel
      .find({
        yogaId: { $exists: true, $ne: null },
      })
      .lean()
      .exec();

    // Calculate total bookings
    const totalBookings = bookings.length;

    // Group by yogaId and count
    const yogaCounts: { [key: string]: number } = {};

    bookings.forEach((booking: any) => {
      const yogaId = booking.yogaId;
      // Also filter out empty strings here
      if (yogaId && yogaId !== '') {
        yogaCounts[yogaId] = (yogaCounts[yogaId] || 0) + 1;
      }
    });

    // Fetch yoga names from Yoga collection
    const yogaIds = Object.keys(yogaCounts);
    const yogaNames = await this.getYogaNames(yogaIds);

    // Build result with percentages
    const results: YogaBookingStatsDto[] = Object.entries(yogaCounts).map(
      ([yogaId, count]) => ({
        yoga_id: yogaId,
        yoga_name: yogaNames[yogaId] || 'Unknown Yoga',
        bookingCount: count,
        percentage:
          totalBookings > 0
            ? parseFloat(((count / totalBookings) * 100).toFixed(2))
            : 0,
      }),
    );

    // Sort by booking count (descending)
    results.sort((a, b) => b.bookingCount - a.bookingCount);

    return results;
  }

  private async getYogaNames(
    yogaIds: string[],
  ): Promise<{ [key: string]: string }> {
    const yogas = await this.yogaModel
      .find({ yogaId: { $in: yogaIds } })
      .lean()
      .exec();

    const nameMap: { [key: string]: string } = {};
    yogas.forEach((yoga: any) => {
      nameMap[yoga.yogaId] = yoga.yoga_name || 'Unnamed Yoga';
    });

    return nameMap;
  }

  async getDashboardStats(
    fromDate: string,
    toDate: string,
  ): Promise<DashboardStatsDto> {
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
    }

    const bookings = await this.bookingModel
      .find({
        scheduledDate: { $exists: true, $ne: null },
      })
      .lean()
      .exec();

    const filteredBookings = bookings.filter((booking: any) => {
      if (booking.scheduledDate && booking.scheduledDate !== '') {
        const bookingDate = new Date(booking.scheduledDate);
        return (
          !isNaN(bookingDate.getTime()) &&
          bookingDate >= startDate &&
          bookingDate <= endDate
        );
      }
      return false;
    });

    const totalBookings = filteredBookings.length;

    const earnings = await this.myEarningModel
      .find({
        date: { $exists: true, $ne: null },
      })
      .lean()
      .exec();

    const filteredEarnings = earnings.filter((earning: any) => {
      if (earning.date && earning.date !== '') {
        const earningDate = new Date(earning.date);
        return (
          !isNaN(earningDate.getTime()) &&
          earningDate >= startDate &&
          earningDate <= endDate
        );
      }
      return false;
    });

    const totalEarnings = filteredEarnings.length;
    const totalEarningsAmount = filteredEarnings.reduce((sum, earning: any) => {
      return sum + (parseFloat(earning.earned_amount) || 0);
    }, 0);

    const uniqueClientIds = new Set<string>();
    filteredBookings.forEach((booking: any) => {
      if (
        booking.clientId &&
        booking.clientId !== '' &&
        booking.clientId !== 'not given'
      ) {
        uniqueClientIds.add(booking.clientId);
      }
    });

    const clientUsers = await this.userModel
      .find({
        userId: { $in: Array.from(uniqueClientIds) },
        role: 'client',
      })
      .lean()
      .exec();

    const activeClients = clientUsers.length;

    const uniqueTrainerIds = new Set<string>();
    filteredBookings.forEach((booking: any) => {
      if (booking.accepted_trainerId && booking.accepted_trainerId !== '') {
        uniqueTrainerIds.add(booking.accepted_trainerId);
      }
    });

    const trainerUsers = await this.userModel
      .find({
        userId: { $in: Array.from(uniqueTrainerIds) },
        role: 'trainer',
      })
      .lean()
      .exec();

    const activeTrainers = trainerUsers.length;

    return {
      totalEarnings,
      totalEarningsAmount: parseFloat(totalEarningsAmount.toFixed(2)),
      totalBookings,
      activeClients,
      activeTrainers,
      fromDate,
      toDate,
    };
  }

  async trainerDashboardApi(userId: string) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const currentDay = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);

      const findTrainer = await this.userModel.aggregate([
        { $match: { userId: userId } },
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'professional_details',
            foreignField: 'yogaId',
            as: 'yoga',
          },
        },
        { $unwind: { path: '$yoga', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'earnings',
            localField: 'userId',
            foreignField: 'trainerId',
            as: 'earnings',
          },
        },
        {
          $lookup: {
            from: 'bookings',
            localField: 'userId',
            foreignField: 'accepted_trainerId',
            as: 'allBookings',
          },
        },
        {
          $addFields: {
            monthlyEarningsTotal: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$earnings',
                      as: 'earning',
                      cond: {
                        $and: [
                          { $gte: ['$$earning.createdAt', startOfMonth] },
                          { $lte: ['$$earning.createdAt', endOfMonth] },
                        ],
                      },
                    },
                  },
                  as: 'filteredEarning',
                  in: {
                    $cond: {
                      if: { $isNumber: '$$filteredEarning.earned_amount' },
                      then: '$$filteredEarning.earned_amount',
                      else: {
                        $toDouble: {
                          $ifNull: ['$$filteredEarning.earned_amount', 0],
                        },
                      },
                    },
                  },
                },
              },
            },
            weeklyBookingsCount: {
              $size: {
                $filter: {
                  input: '$allBookings',
                  as: 'booking',
                  cond: {
                    $and: [
                      { $eq: ['$$booking.status', 'accepted'] },
                      { $gte: ['$$booking.createdAt', startOfWeek] },
                    ],
                  },
                },
              },
            },
            acceptedBookings: {
              $filter: {
                input: '$allBookings',
                as: 'booking',
                cond: {
                  $eq: ['$$booking.status', 'accepted'],
                },
              },
            },
          },
        },
        {
          $project: {
            trainer_name: '$name',
            yoga_name: '$yoga.yoga_name',
            milestone: {
              $let: {
                vars: {
                  roundedTo1000: {
                    $multiply: [
                      { $ceil: { $divide: ['$monthlyEarningsTotal', 1000] } },
                      1000,
                    ],
                  },
                },
                in: {
                  $cond: {
                    if: { $lt: ['$$roundedTo1000', 1000] },
                    then: 1000,
                    else: {
                      $multiply: [
                        {
                          $pow: [10, { $ceil: { $log10: '$$roundedTo1000' } }],
                        },
                        1,
                      ],
                    },
                  },
                },
              },
            },
            earning_overview: '$monthlyEarningsTotal',
            weekly_bookings_count: '$weeklyBookingsCount',
            accepted_bookings: '$acceptedBookings',
          },
        },
      ]);

      if (findTrainer && findTrainer.length > 0) {
        const result = findTrainer[0];

        // Filter upcoming bookings
        const upcomingBookingsRaw =
          result.accepted_bookings?.filter((booking) => {
            const [hours, minutes, seconds] = booking.time
              .split(':')
              .map(Number);
            const scheduledDate = new Date(booking.scheduledDate);
            scheduledDate.setHours(hours, minutes, seconds, 0);
            return scheduledDate.getTime() >= currentDate.getTime();
          }) || [];

        // Fetch client and yoga details for each upcoming booking
        const upcomingBookings = await Promise.all(
          upcomingBookingsRaw.map(async (booking) => {
            // Fetch client details
            const clientDetails = await this.userModel
              .findOne({ userId: booking.clientId })
              .select('userId name profile_pic')
              .lean();

            // Fetch yoga details
            const yogaDetails = await this.yogaModel
              .findOne({ yogaId: booking.yogaId })
              .select('yogaId yoga_name trainer_price duration')
              .lean();

            return {
              ...booking,
              clientDetails: clientDetails || null,
              yogaDetails: yogaDetails || null,
            };
          }),
        );

        delete result.accepted_bookings;
        result.upcoming_bookings = upcomingBookings;

        return {
          statusCode: HttpStatus.OK,
          message: 'Trainer Details',
          data: result,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Trainer not found',
        };
      }
    } catch (error) {
      console.error('Error in trainerDashboardApi:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async clientDashboardApi(userId: string) {
    try {
      const currentDate = new Date();

      const findClient = await this.userModel.aggregate([
        { $match: { userId: userId } },
        {
          $lookup: {
            from: 'bookings',
            localField: 'userId',
            foreignField: 'clientId',
            as: 'allBookings',
          },
        },
        {
          $project: {
            client_name: '$name',
            profile_pic: '$profile_pic',
            accepted_bookings: '$allBookings',
          },
        },
      ]);

      if (findClient && findClient.length > 0) {
        const result = findClient[0];

        const upcomingBookingsRaw =
          result.accepted_bookings?.filter((booking) => {
            const [hours, minutes, seconds] = booking.time
              .split(':')
              .map(Number);
            const scheduledDate = new Date(booking.scheduledDate);
            scheduledDate.setHours(hours, minutes, seconds, 0);
            return scheduledDate.getTime() >= currentDate.getTime();
          }) || [];

        const upcomingBookings = await Promise.all(
          upcomingBookingsRaw.map(async (booking) => {
            const trainerDetails = await this.userModel
              .findOne({ userId: booking.accepted_trainerId })
              .select('userId name profile_pic')
              .lean();

            const yogaDetails = await this.yogaModel
              .findOne({ yogaId: booking.yogaId })
              .select('yogaId yoga_name trainer_price duration')
              .lean();

            return {
              ...booking,
              trainerDetails: trainerDetails || null,
              yogaDetails: yogaDetails || null,
            };
          }),
        );

        delete result.accepted_bookings;
        result.upcoming_bookings = upcomingBookings;

        return {
          statusCode: HttpStatus.OK,
          message: 'Client Details',
          data: result,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Client not found',
        };
      }
    } catch (error) {
      console.error('Error in clientDashboardApi:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
