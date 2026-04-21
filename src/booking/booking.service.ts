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
import { userRoomDetialsDto } from './dto/userRoomDetails.dto';
import { SessionsService } from 'src/sessions/sessions.service';
import { InAppNotificationsService } from 'src/in-app-notifications/in-app-notifications.service';
import { InAppNotifications } from 'src/in-app-notifications/schema/inapp.schema';
import { inAppNotificationsDto } from 'src/in-app-notifications/dto/inapp.dto';
import { RoomSessions } from 'src/sessions/schema/sessions.schema';
import { GetEarningsDto } from './dto/getearnings.dto';
import { orderAlertDto } from './dto/order_alert.dto';
import { OrderAlert } from './schema/order_alert.schema';
import { TrainerEvents } from 'src/users/schema/trainer_availability.schema';
import { PassedOrders } from 'src/passed_orders/schema/passed_orders.schema';
import { SessionStatus } from 'src/session-status/schema/session_status.schema';

@Injectable()
export class BookingService {
  private readonly IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  private razorpay: any;
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Earning.name)
    private readonly earningModel: Model<Earning>,
    @InjectModel(YogaDetails.name)
    private readonly yogaModel: Model<YogaDetails>,
    @InjectModel(MyEarnings.name)
    private readonly myEarningModel: Model<MyEarnings>,
    private readonly sessionsService: SessionsService,
    private readonly inappNotificationService: InAppNotificationsService,
    @InjectModel(InAppNotifications.name)
    private readonly inAppNotificationModel: Model<InAppNotifications>,
    @InjectModel(RoomSessions.name)
    private readonly roomSessionModel: Model<RoomSessions>,
    @InjectModel(SessionStatus.name)
    private readonly sessionStatusModel: Model<SessionStatus>,
    @InjectModel(OrderAlert.name)
    private readonly orderAlertModel: Model<OrderAlert>,
    @InjectModel(TrainerEvents.name)
    private readonly trainerEventsModel: Model<TrainerEvents>,
    @InjectModel(PassedOrders.name)
    private readonly passedOrderModel: Model<PassedOrders>,
  ) {
    console.log(
      'Razorpay Key ID:',
      process.env.RAZORPAY_KEY_ID ? '✅ loaded' : '❌ missing',
    );
    console.log(
      'Razorpay Secret:',
      process.env.RAZORPAY_KEY_SECRET ? '✅ loaded' : '❌ missing',
    );
    this.razorpay = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

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
  // test mode createbooking
  async createBooking(req: bookingDto) {
    try {
      const paymentDetails = await this.razorpay.payments.fetch(
        req.transactionId,
      );

      console.log('Payment fetch result:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        method: paymentDetails.method,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
      });

      const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

      if (paymentDetails.status === 'authorized') {
        if (isTestMode && paymentDetails.method === 'upi') {
          // ✅ Test mode UPI: force capture via dashboard-simulated API call
          // Razorpay test mode UPI requires capturing before refund is possible
          try {
            const capturedPayment = await this.razorpay.payments.capture(
              req.transactionId,
              Number(paymentDetails.amount),
              paymentDetails.currency || 'INR',
            );
            console.log('Test UPI capture result:', capturedPayment.status);
          } catch (captureErr) {
            // ⚠️ If capture fails in test mode (UPI limitation), proceed anyway
            // In live mode this won't happen — UPI is auto-captured
            console.warn(
              'Test mode UPI capture skipped (API limitation):',
              captureErr?.error?.description,
            );
          }
        } else {
          // ✅ Live mode or non-UPI — must capture successfully
          const capturedPayment = await this.razorpay.payments.capture(
            req.transactionId,
            Number(paymentDetails.amount),
            paymentDetails.currency || 'INR',
          );

          if (capturedPayment.status !== 'captured') {
            return {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              message: 'Payment capture failed.',
            };
          }
        }
      } else if (paymentDetails.status !== 'captured') {
        return {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: `Payment is in '${paymentDetails.status}' status. Cannot create booking.`,
        };
      }

      // ✅ Prevent duplicate booking
      const existingBooking = await this.bookingModel.findOne({
        transactionId: req.transactionId,
      });
      if (existingBooking) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A booking with this transaction ID already exists.',
          data: existingBooking,
        };
      }

      const trainers = await this.userModel.find({
        professional_details: {
          $regex: new RegExp(`(^|,)${req.yogaId}(,|$)`),
        },
      });
      const allTrainerIds = trainers.map((trainer) => trainer.userId);

      const bookingDate = new Date(req.scheduledDate);

      const availableTrainerIds = await this.filterAvailableTrainers(
        allTrainerIds,
        bookingDate,
      );
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
        trainerIds: availableTrainerIds,
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
      console.error('createBooking error:', JSON.stringify(error, null, 2));
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message || JSON.stringify(error) || 'Unknown error',
      };
    }
  }

  // live mode createbooking
  // async createBooking(req: bookingDto) {
  //   try {
  //     const transactionId = req.transactionId?.trim();

  //     if (!transactionId) {
  //       return {
  //         statusCode: HttpStatus.BAD_REQUEST,
  //         message: 'transactionId is required.',
  //       };
  //     }

  //     // ✅ Prevent duplicate booking FIRST before hitting Razorpay
  //     const existingBooking = await this.bookingModel.findOne({
  //       transactionId,
  //     });
  //     if (existingBooking) {
  //       return {
  //         statusCode: HttpStatus.CONFLICT,
  //         message: 'A booking with this transaction ID already exists.',
  //         data: existingBooking,
  //       };
  //     }

  //     const paymentDetails = await this.razorpay.payments.fetch(transactionId);

  //     console.log('Payment fetch result:', {
  //       id: paymentDetails.id,
  //       status: paymentDetails.status,
  //       method: paymentDetails.method,
  //       amount: paymentDetails.amount,
  //       currency: paymentDetails.currency,
  //     });

  //     const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

  //     if (paymentDetails.status === 'authorized') {
  //       if (isTestMode) {
  //         // ✅ Test mode — skip capture, proceed directly
  //         console.log('TEST MODE: Skipping capture, proceeding with booking.');
  //       } else {
  //         // ✅ Live mode — must capture explicitly
  //         console.log('LIVE MODE: Capturing payment...');
  //         const capturedPayment = await this.razorpay.payments.capture(
  //           transactionId,
  //           Number(paymentDetails.amount), // exact paise amount
  //           paymentDetails.currency || 'INR',
  //         );

  //         console.log('Capture result:', {
  //           id: capturedPayment.id,
  //           status: capturedPayment.status,
  //           amount: capturedPayment.amount,
  //         });

  //         if (capturedPayment.status !== 'captured') {
  //           return {
  //             statusCode: HttpStatus.PAYMENT_REQUIRED,
  //             message: `Payment capture failed. Status: ${capturedPayment.status}`,
  //           };
  //         }
  //       }
  //     } else if (paymentDetails.status === 'captured') {
  //       // ✅ Already captured (e.g. auto-captured by Razorpay) — proceed
  //       console.log('Payment already captured, proceeding with booking.');
  //     } else {
  //       // ❌ failed / refunded / any other status
  //       return {
  //         statusCode: HttpStatus.PAYMENT_REQUIRED,
  //         message: `Payment is in '${paymentDetails.status}' status. Cannot create booking.`,
  //       };
  //     }

  //     const trainers = await this.userModel.find({
  //       professional_details: req.yogaId,
  //     });
  //     const allTrainerIds = trainers.map((trainer) => trainer.userId);
  //     const bookingDate = new Date(req.scheduledDate);
  //     const availableTrainerIds = await this.filterAvailableTrainers(
  //       allTrainerIds,
  //       bookingDate,
  //     );

  //     const sAt = new Date(req.scheduledDate);
  //     const formattedTime = this.formatTimeToHHMMSS(req.time);

  //     const addbooking = await this.bookingModel.create({
  //       bookingType: req.bookingType,
  //       languageId: req.languageId,
  //       yogaId: req.yogaId,
  //       clientId: req.clientId,
  //       scheduledDate: sAt,
  //       time: formattedTime,
  //       package_details: req.package_details,
  //       sessionId: req.sessionId,
  //       transactionId,
  //       paymentStatus: 'captured',
  //       trainerIds: availableTrainerIds,
  //     });

  //     if (addbooking) {
  //       return {
  //         statusCode: HttpStatus.OK,
  //         message: 'Booking created and payment captured successfully.',
  //         data: addbooking,
  //       };
  //     } else {
  //       return {
  //         statusCode: HttpStatus.EXPECTATION_FAILED,
  //         message: 'Failed to create booking.',
  //       };
  //     }
  //   } catch (error) {
  //     console.error('createBooking error:', JSON.stringify(error, null, 2));
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error?.message || JSON.stringify(error) || 'Unknown error',
  //     };
  //   }
  // }

  private async filterAvailableTrainers(
    trainerIds: string[],
    bookingDate: Date,
  ): Promise<string[]> {
    const availableTrainers: string[] = [];

    for (const trainerId of trainerIds) {
      const events = await this.trainerEventsModel.find({ userId: trainerId });
      const hasConflict = events.some((event) =>
        this.isConflicting(event, bookingDate),
      );

      if (!hasConflict) {
        availableTrainers.push(trainerId);
      }
    }

    return availableTrainers;
  }

  private isConflicting(event: TrainerEvents, bookingDate: Date): boolean {
    const eventStart = new Date(event.startDateTime);
    const eventEnd = new Date(event.endDateTime);

    // Strip to date only (IST offset +5:30)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const bookingDay = new Date(bookingDate.getTime() + IST_OFFSET);
    bookingDay.setUTCHours(0, 0, 0, 0);

    const eventStartDay = new Date(eventStart.getTime() + IST_OFFSET);
    eventStartDay.setUTCHours(0, 0, 0, 0);

    const eventEndDay = new Date(eventEnd.getTime() + IST_OFFSET);
    eventEndDay.setUTCHours(0, 0, 0, 0);

    const booking = bookingDay.getTime();
    const start = eventStartDay.getTime();
    const end = eventEndDay.getTime();

    switch (event.repeat) {
      case 'one-time':
        return booking >= start && booking <= end;

      case 'daily':
        return booking >= start;

      case 'weekly':
        if (booking < start) return false;
        return bookingDay.getUTCDay() === eventStartDay.getUTCDay();

      case 'monthly':
        if (booking < start) return false;
        return bookingDay.getUTCDate() === eventStartDay.getUTCDate();

      default:
        return false;
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

      // Clean up empty filter values
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] === '' ||
          filters[key] === null ||
          filters[key] === undefined
        ) {
          delete filters[key];
        }
      });

      const match: any = {};
      const isStatusOpened =
        filters.status && filters.status.toLowerCase() === 'opened';

      // ✅ FIX 1: Removed the trainer.professional_details → match.yogaId assignment
      // that was corrupting the match stage and causing 0 results.
      if (filters.accepted_trainerId) {
        if (isStatusOpened) {
          // For opened bookings, filter by trainerIds array (trainer hasn't accepted yet)
          match.trainerIds = filters.accepted_trainerId;
        } else {
          // For other statuses, filter by accepted_trainerId (trainer already accepted)
          match.accepted_trainerId = filters.accepted_trainerId;
        }
      }

      if (filters.bookingId) match.bookingId = filters.bookingId;
      if (filters.clientId) match.clientId = filters.clientId;

      if (filters.status) {
        match.status = {
          $regex: new RegExp(filters.status, 'i'),
        };
      }

      if (filters.time) match.time = filters.time;

      if (filters.bookingType) {
        match.bookingType = {
          $regex: new RegExp(filters.bookingType, 'i'),
        };
      }

      // Date range filter
      if (filters.fromDate || filters.toDate) {
        const datePatterns: string[] = [];

        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;

        const formatDate = (date: Date): string => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
            datePatterns.push(formatDate(current));
            current.setDate(current.getDate() + 1);
          }
        } else if (fromDate) {
          const current = new Date(fromDate);
          const endDate = new Date(fromDate);
          endDate.setDate(endDate.getDate() + 365);
          while (current <= endDate) {
            datePatterns.push(formatDate(current));
            current.setDate(current.getDate() + 1);
          }
        } else if (toDate) {
          const current = new Date(toDate);
          current.setDate(current.getDate() - 365);
          const endDate = new Date(toDate);
          while (current <= endDate) {
            datePatterns.push(formatDate(current));
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

      // Single scheduled date filter (only when no date range provided)
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

      // ✅ FIX 2: Changed filters.trainerId → filters.accepted_trainerId
      // so passed orders are correctly excluded when filtering opened bookings
      let excludedBookingIds: string[] = [];

      if (isStatusOpened && filters.accepted_trainerId) {
      if (isStatusOpened && filters.accepted_trainerId) {
        const passedOrders = await this.passedOrderModel
          .find({ trainerId: filters.accepted_trainerId }, { bookingId: 1, _id: 0 })
          .lean();

        excludedBookingIds = passedOrders.map((order) => order.bookingId);
      }

      if (excludedBookingIds.length > 0) {
        if (match.bookingId) {
          match.bookingId = {
            $eq: match.bookingId,
            $nin: excludedBookingIds,
          };
        } else {
          match.bookingId = { $nin: excludedBookingIds };
        }
      }

      // Build aggregation pipeline
      const pipeline: any[] = [{ $match: match }];

      pipeline.push(
        // Join client details
        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: 'userId',
            as: 'clientId',
          },
        },
        { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

        // Join accepted trainer details
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

        // Join yoga details
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'yogaId',
            foreignField: 'yogaId',
            as: 'yogaId',
          },
        },
        {
          $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            yogaId: {
              $cond: {
                if: { $ne: ['$yogaId', null] },
                then: '$yogaId',
                else: '$$REMOVE',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'languages',
            localField: 'languageId',
            foreignField: 'languageId',
            as: 'languageId',
          },
        },
        {
          $unwind: { path: '$languageId', preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            languageId: {
              $cond: {
                if: { $ne: ['$languageId', null] },
                then: '$languageId',
                else: '$$REMOVE',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'roomsessions',
            localField: 'bookingId',
            foreignField: 'bookingId',
            as: 'sessionDetails',
          },
        },

        // Join session status
        {
          $lookup: {
            from: 'sessionstatuses',
            localField: 'bookingId',
            foreignField: 'bookingId',
            as: 'sessionStatus',
          },
        },
      );

      // Flatten sessionDetails to single object
      pipeline.push({
        $addFields: {
          sessionDetails: { $arrayElemAt: ['$sessionDetails', 0] },
        },
      });

      // Post-lookup name filters
      const nameMatch: any = {};

      if (filters.clientName) {
        nameMatch['clientId.name'] = {
          $regex: new RegExp(filters.clientName.trim(), 'i'),
        };
      }

      if (filters.trainerName) {
        nameMatch['accepted_trainerId.name'] = {
          $regex: new RegExp(filters.trainerName.trim(), 'i'),
        };
      }

      if (filters.yogaName) {
        nameMatch['yogaId.yoga_name'] = {
          $regex: new RegExp(filters.yogaName.trim(), 'i'),
        };
      }

      if (Object.keys(nameMatch).length > 0) {
        pipeline.push({ $match: nameMatch });
      }

      const sortDirection = filters.sortOrder?.toLowerCase().startsWith('asc')
        ? 1
        : -1;

      pipeline.push({
        $sort: { createdAt: sortDirection, _id: sortDirection },
      });

      // Export mode — return all records without pagination
      if (filters.isExport === 'true' || filters.isExport === true) {
        const data = await this.bookingModel.aggregate(pipeline);
        return {
          statusCode: 200,
          message: 'Export data fetched successfully',
          totalCount: data.length,
          data,
        };
      }

      // Paginated mode
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

  // async getBookings(page: number, limit: number, filters: any) {
  //   try {
  //     const skip = (page - 1) * limit;
  //     Object.keys(filters).forEach((key) => {
  //       if (
  //         filters[key] === '' ||
  //         filters[key] === null ||
  //         filters[key] === undefined
  //       ) {
  //         delete filters[key];
  //       }
  //     });
  //     const match: any = {};
  //     const isStatusOpened =
  //       filters.status && filters.status.toLowerCase() === 'opened';

  //     if (filters.bookingId) match.bookingId = filters.bookingId;
  //     if (filters.clientId) match.clientId = filters.clientId;
  //     if (filters.accepted_trainerId) {
  //       if (isStatusOpened) {
  //         match.trainerIds = filters.accepted_trainerId;

  //         const trainer = await this.userModel
  //           .findOne({ userId: filters.accepted_trainerId })
  //           .lean();

  //         console.log('professional_details:', trainer?.professional_details);

  //         if (trainer?.professional_details) {
  //           match.yogaId = trainer.professional_details;
  //         }
  //       } else {
  //         match.accepted_trainerId = filters.accepted_trainerId;
  //       }
  //     }
  //     if (filters.status) {
  //       match.status = {
  //         $regex: new RegExp(filters.status, 'i'),
  //       };
  //     }
  //     if (filters.time) match.time = filters.time;
  //     if (filters.bookingType) {
  //       match.bookingType = {
  //         $regex: new RegExp(filters.bookingType, 'i'),
  //       };
  //     }

  //     if (filters.fromDate || filters.toDate) {
  //       const datePatterns: string[] = [];

  //       const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
  //       const toDate = filters.toDate ? new Date(filters.toDate) : null;

  //       const formatDate = (date: Date): string => {
  //         const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  //         const months = [
  //           'Jan',
  //           'Feb',
  //           'Mar',
  //           'Apr',
  //           'May',
  //           'Jun',
  //           'Jul',
  //           'Aug',
  //           'Sep',
  //           'Oct',
  //           'Nov',
  //           'Dec',
  //         ];

  //         const dayName = days[date.getDay()];
  //         const monthName = months[date.getMonth()];
  //         const day = date.getDate();
  //         const year = date.getFullYear();

  //         return `${dayName} ${monthName} ${day} ${year}`;
  //       };

  //       if (fromDate && toDate) {
  //         const current = new Date(fromDate);
  //         while (current <= toDate) {
  //           const dateStr = formatDate(current);
  //           datePatterns.push(dateStr);
  //           current.setDate(current.getDate() + 1);
  //         }
  //       } else if (fromDate) {
  //         const current = new Date(fromDate);
  //         const endDate = new Date(fromDate);
  //         endDate.setDate(endDate.getDate() + 365);

  //         while (current <= endDate) {
  //           const dateStr = formatDate(current);
  //           datePatterns.push(dateStr);
  //           current.setDate(current.getDate() + 1);
  //         }
  //       } else if (toDate) {
  //         const current = new Date(toDate);
  //         current.setDate(current.getDate() - 365);
  //         const endDate = new Date(toDate);

  //         while (current <= endDate) {
  //           const dateStr = formatDate(current);
  //           datePatterns.push(dateStr);
  //           current.setDate(current.getDate() + 1);
  //         }
  //       }

  //       if (datePatterns.length > 0) {
  //         const regexPattern = datePatterns.join('|');
  //         match.scheduledDate = {
  //           $regex: new RegExp(regexPattern, 'i'),
  //         };
  //       }
  //     }

  //     if (filters.scheduledDate && !filters.fromDate && !filters.toDate) {
  //       const date = new Date(filters.scheduledDate);

  //       const options: Intl.DateTimeFormatOptions = { month: 'short' };
  //       const month = date.toLocaleString('en-US', options);
  //       const day = date.getDate();
  //       const year = date.getFullYear();

  //       const formattedDate = `${month} ${day} ${year}`;

  //       match.scheduledDate = {
  //         $regex: formattedDate,
  //         $options: 'i',
  //       };
  //     }

  //     let excludedBookingIds: string[] = [];

  //     if (isStatusOpened && filters.trainerId) {
  //       const passedOrders = await this.passedOrderModel
  //         .find({ trainerId: filters.trainerId }, { bookingId: 1, _id: 0 })
  //         .lean();

  //       excludedBookingIds = passedOrders.map((order) => order.bookingId);
  //     }

  //     // ✅ Exclude the removed bookingIds from the match stage
  //     if (excludedBookingIds.length > 0) {
  //       match.bookingId = {
  //         $nin: excludedBookingIds,
  //       };
  //     }

  //     const pipeline: any[] = [{ $match: match }];

  //     pipeline.push(
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'clientId',
  //           foreignField: 'userId',
  //           as: 'clientId',
  //         },
  //       },
  //       { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'accepted_trainerId',
  //           foreignField: 'userId',
  //           as: 'accepted_trainerId',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$accepted_trainerId',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },

  //       {
  //         $lookup: {
  //           from: 'yogadetails',
  //           localField: 'yogaId',
  //           foreignField: 'yogaId',
  //           as: 'yogaId',
  //         },
  //       },
  //       { $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'languages',
  //           localField: 'languageId',
  //           foreignField: 'languageId',
  //           as: 'languageId',
  //         },
  //       },
  //       { $unwind: { path: '$languageId', preserveNullAndEmptyArrays: true } },
  //       {
  //         $lookup: {
  //           from: 'roomsessions',
  //           localField: 'bookingId',
  //           foreignField: 'bookingId',
  //           as: 'sessionDetails',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'sessionstatuses',
  //           localField: 'bookingId',
  //           foreignField: 'bookingId',
  //           as: 'sessionStatus',
  //         },
  //       },
  //     );

  //     pipeline.push({
  //       $addFields: {
  //         sessionDetails: { $arrayElemAt: ['$sessionDetails', 0] },
  //       },
  //     });

  //     const nameMatch: any = {};

  //     if (filters.clientName) {
  //       nameMatch['clientId.name'] = {
  //         $regex: new RegExp(filters.clientName.trim(), 'i'),
  //       };
  //     }

  //     if (filters.trainerName) {
  //       nameMatch['accepted_trainerId.name'] = {
  //         $regex: new RegExp(filters.trainerName.trim(), 'i'),
  //       };
  //     }

  //     if (filters.yogaName) {
  //       nameMatch['yogaId.yoga_name'] = {
  //         $regex: new RegExp(filters.yogaName.trim(), 'i'),
  //       };
  //     }

  //     if (Object.keys(nameMatch).length > 0) {
  //       pipeline.push({ $match: nameMatch });
  //     }

  //     pipeline.push({ $sort: { createdAt: -1 } });

  //     const sortDirection = filters.sortOrder?.toLowerCase().startsWith('asc')
  //       ? 1
  //       : -1;
  //     pipeline.push({
  //       $sort: { createdAt: sortDirection, _id: sortDirection },
  //     });

  //     if (filters.isExport === 'true' || filters.isExport === true) {
  //       const data = await this.bookingModel.aggregate(pipeline);
  //       return {
  //         statusCode: 200,
  //         message: 'Export data fetched successfully',
  //         totalCount: data.length,
  //         data,
  //       };
  //     }

  //     pipeline.push({
  //       $facet: {
  //         data: [{ $skip: skip }, { $limit: limit }],
  //         totalCount: [{ $count: 'count' }],
  //       },
  //     });

  //     const result = await this.bookingModel.aggregate(pipeline);

  //     const bookings = result[0].data;
  //     const totalCount = result[0].totalCount[0]?.count || 0;

  //     return {
  //       statusCode: 200,
  //       message: 'List of Bookings',
  //       currentPage: page,
  //       limit,
  //       totalCount,
  //       totalPages: Math.ceil(totalCount / limit),
  //       data: bookings,
  //     };
  //   } catch (error) {
  //     console.error('Error in getBookings:', error);
  //     return {
  //       statusCode: 500,
  //       message: error.message || error,
  //     };
  //   }
  // }

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
      const findBooking = await this.bookingModel.findOne({
        bookingId: req.bookingId,
      });
      if (findBooking?.status == 'accepted') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Booking already accepted by another trainer',
        };
      }
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
        const findBookingSessions = await this.roomSessionModel.updateOne(
          { bookingId: req.bookingId },
          {
            $set: {
              trainerId: req.accepted_trainerId,
            },
          },
        );
        const findBookingSessionStatus =
          await this.sessionStatusModel.updateOne(
            { bookingId: req.bookingId },
            {
              $set: {
                trainerId: req.accepted_trainerId,
              },
            },
          );
        let inappDto: any = {} as inAppNotificationsDto;
        const acceptNotification =
          await this.inappNotificationService.addInAppNotification({
            ...inappDto,
            userId: findBooking?.clientId,
            message: 'Yay! Your booking has been accepted by a trainer.',
            type: 'accept_booking',
          });
        await this.orderAlertModel.updateOne(
          {
            $and: [
              { bookingId: req.bookingId },
              { trainerId: req.accepted_trainerId },
            ],
          },
          {
            $set: { status: 'accepted' },
          },
        );
        await this.orderAlertModel.deleteMany({
          $and: [{ bookingId: req.bookingId }, { status: 'pending' }],
        });
        if (acceptNotification) {
          await this.inAppNotificationModel.updateOne(
            {
              inapp_notification_id:
                acceptNotification?.data?.inapp_notification_id,
            },
            {
              $set: {
                status: 'success',
              },
            },
          );
        }
        const findSession = await this.roomSessionModel.findOne({
          bookingId: req.bookingId,
        });
        return {
          statusCode: HttpStatus.OK,
          message: 'Booking accepted successfully',
          data: findSession,
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

  async ongoingStatus(req: bookingDto) {
    const accept = await this.bookingModel.updateOne(
      { bookingId: req.bookingId },
      {
        $set: {
          status: 'ongoing',
        },
      },
    );
    if (accept) {
      const findBooking = await this.bookingModel.findOne({
        bookingId: req.bookingId,
      });
      let inappDto: any = {} as inAppNotificationsDto;
      const acceptNotification =
        await this.inappNotificationService.addInAppNotification({
          ...inappDto,
          userId: findBooking?.clientId,
          message: 'Yay! Your booking has started.',
          type: 'ongoing_booking',
        });
      await this.orderAlertModel.updateOne(
        {
          $and: [
            { bookingId: req.bookingId },
            { trainerId: findBooking?.accepted_trainerId },
          ],
        },
        {
          $set: { status: 'ongoing' },
        },
      );
      if (acceptNotification) {
        await this.inAppNotificationModel.updateOne(
          {
            inapp_notification_id:
              acceptNotification?.data?.inapp_notification_id,
          },
          {
            $set: {
              status: 'success',
            },
          },
        );
      }
      // const findSession = await this.roomSessionModel.findOne({
      //   bookingId: req.bookingId,
      // });
      return {
        statusCode: HttpStatus.OK,
        message: 'Booking started successfully',
      };
    } else {
      return {
        statusCode: HttpStatus.EXPECTATION_FAILED,
        message: 'Failed to accept booking.',
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
            await this.bookingModel.updateOne(
              { bookingId: req.bookingId },
              {
                $set: {
                  status: 'completed',
                },
              },
            );
            await this.orderAlertModel.updateOne(
              { bookingId: req.bookingId },
              {
                $set: {
                  status: 'completed',
                },
              },
            );
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

  // async getEarnings(req: earningDto) {
  //   try {
  //     const result = await this.earningModel.aggregate([
  //       { $match: { trainerId: req.trainerId } },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'clientId',
  //           foreignField: 'userId',
  //           as: 'clientId',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'bookings',
  //           localField: 'bookingId',
  //           foreignField: 'bookingId',
  //           as: 'bookingId',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'yogadetails',
  //           localField: 'yogaId',
  //           foreignField: 'yogaId',
  //           as: 'yogaId',
  //         },
  //       },
  //       {
  //         $facet: {
  //           data: [
  //             { $sort: { createdAt: -1 } }, // optional
  //           ],
  //           total: [
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalAmount: { $sum: '$earned_amount' },
  //               },
  //             },
  //           ],
  //         },
  //       },
  //     ]);

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Earnings of Trainer',
  //       Total: result[0]?.total[0]?.totalAmount || 0,
  //       data: result[0]?.data || [],
  //     };
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message,
  //     };
  //   }
  // }

  async getEarnings(req: earningDto, page?: number, limit?: number) {
    try {
      const matchStage: Record<string, any> = {
        trainerId: req.trainerId,
      };

      if (req.fromDate || req.toDate) {
        const dateConditions: any[] = [];

        if (req.fromDate) {
          const from = new Date(req.fromDate);
          from.setHours(0, 0, 0, 0);
          dateConditions.push({
            $gte: [
              {
                $dateFromString: {
                  dateString: { $substrCP: ['$date', 4, 29] },
                  format: '%b %d %Y %H:%M:%S %z',
                  onError: null,
                  onNull: null,
                },
              },
              from,
            ],
          });
        }

        if (req.toDate) {
          const to = new Date(req.toDate);
          to.setHours(23, 59, 59, 999);
          dateConditions.push({
            $lte: [
              {
                $dateFromString: {
                  dateString: { $substrCP: ['$date', 4, 29] },
                  format: '%b %d %Y %H:%M:%S %z',
                  onError: null,
                  onNull: null,
                },
              },
              to,
            ],
          });
        }

        matchStage['$expr'] =
          dateConditions.length === 1
            ? dateConditions[0]
            : { $and: dateConditions };
      }

      const bookingMatchStage: Record<string, any> = {};

      if (req.bookingType && req.bookingType.trim() !== '') {
        bookingMatchStage['bookingDetails.bookingType'] = req.bookingType;
      }

      const yogaMatchStage: Record<string, any> = {};

      if (req.yogaType && req.yogaType.trim() !== '') {
        yogaMatchStage['yogaDetails.yoga_name'] = {
          $regex: req.yogaType,
          $options: 'i',
        };
      }

      const hasBookingFilter = Object.keys(bookingMatchStage).length > 0;
      const hasYogaFilter = Object.keys(yogaMatchStage).length > 0;

      const basePipeline: any[] = [
        { $match: matchStage },

        {
          $lookup: {
            from: 'bookings',
            localField: 'bookingId',
            foreignField: 'bookingId',
            as: 'bookingDetails',
          },
        },
        {
          $unwind: {
            path: '$bookingDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        ...(hasBookingFilter ? [{ $match: bookingMatchStage }] : []),

        {
          $lookup: {
            from: 'users',
            localField: 'clientId',
            foreignField: 'userId',
            as: 'clientDetails',
          },
        },
        {
          $unwind: {
            path: '$clientDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: 'yogadetails',
            localField: 'yogaId',
            foreignField: 'yogaId',
            as: 'yogaDetails',
          },
        },
        {
          $unwind: {
            path: '$yogaDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        ...(hasYogaFilter ? [{ $match: yogaMatchStage }] : []),
      ];

      const isPaginated = page !== undefined && limit !== undefined;
      const _page = Number(page) || 1;
      const _limit = Number(limit) || 10;
      const skip = (_page - 1) * _limit;

      if (isPaginated) {
        const result = await this.earningModel.aggregate([
          ...basePipeline,
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: _limit },
              ],
              total: [
                {
                  $group: {
                    _id: null,
                    totalAmount: { $sum: '$earned_amount' },
                    totalRecords: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ]);

        const totalRecords = result[0]?.total[0]?.totalRecords || 0;

        return {
          statusCode: HttpStatus.OK,
          message: 'Earnings of Trainer',
          Total: result[0]?.total[0]?.totalAmount || 0,
          currentPage: _page,
          limit: _limit,
          totalCount: totalRecords,
          totalPages: Math.ceil(totalRecords / _limit),
          data: result[0]?.data || [],
        };
      }

      const result = await this.earningModel.aggregate([
        ...basePipeline,
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

  // async getEarnings(req: earningDto, page?: number, limit?: number) {
  //   try {
  //     const matchStage: Record<string, any> = {
  //       trainerId: req.trainerId,
  //     };

  //     if (req.fromDate || req.toDate) {
  //       const dateConditions: any[] = [];

  //       if (req.fromDate) {
  //         const from = new Date(req.fromDate);
  //         from.setHours(0, 0, 0, 0);
  //         dateConditions.push({
  //           $gte: [
  //             {
  //               $dateFromString: {
  //                 dateString: { $substrCP: ['$date', 4, 29] },
  //                 format: '%b %d %Y %H:%M:%S %z',
  //                 onError: null,
  //                 onNull: null,
  //               },
  //             },
  //             from,
  //           ],
  //         });
  //       }

  //       if (req.toDate) {
  //         const to = new Date(req.toDate);
  //         to.setHours(23, 59, 59, 999);
  //         dateConditions.push({
  //           $lte: [
  //             {
  //               $dateFromString: {
  //                 dateString: { $substrCP: ['$date', 4, 29] },
  //                 format: '%b %d %Y %H:%M:%S %z',
  //                 onError: null,
  //                 onNull: null,
  //               },
  //             },
  //             to,
  //           ],
  //         });
  //       }

  //       matchStage['$expr'] =
  //         dateConditions.length === 1
  //           ? dateConditions[0]
  //           : { $and: dateConditions };
  //     }

  //     const bookingMatchStage: Record<string, any> = {};

  //     if (req.yogaType && req.yogaType.trim() !== '') {
  //       bookingMatchStage['bookingDetails.yogaType'] = req.yogaType;
  //     }

  //     if (req.bookingType && req.bookingType.trim() !== '') {
  //       bookingMatchStage['bookingDetails.bookingType'] = req.bookingType;
  //     }

  //     const hasBookingFilter = Object.keys(bookingMatchStage).length > 0;

  //     const basePipeline: any[] = [
  //       { $match: matchStage },

  //       {
  //         $lookup: {
  //           from: 'bookings',
  //           localField: 'bookingId',
  //           foreignField: 'bookingId',
  //           as: 'bookingDetails',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$bookingDetails',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },

  //       ...(hasBookingFilter ? [{ $match: bookingMatchStage }] : []),

  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'clientId',
  //           foreignField: 'userId',
  //           as: 'clientDetails',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$clientDetails',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },

  //       {
  //         $lookup: {
  //           from: 'yogadetails',
  //           localField: 'yogaId',
  //           foreignField: 'yogaId',
  //           as: 'yogaDetails',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$yogaDetails',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //     ];

  //     const isPaginated = page !== undefined && limit !== undefined;
  //     const _page  = Number(page)  || 1;
  //     const _limit = Number(limit) || 10;
  //     const skip   = (_page - 1) * _limit;

  //     if (isPaginated) {
  //       const result = await this.earningModel.aggregate([
  //         ...basePipeline,
  //         {
  //           $facet: {
  //             data: [
  //               { $sort: { createdAt: -1 } },
  //               { $skip: skip },
  //               { $limit: _limit },
  //             ],
  //             total: [
  //               {
  //                 $group: {
  //                   _id: null,
  //                   totalAmount: { $sum: '$earned_amount' },
  //                   totalRecords: { $sum: 1 },
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       ]);

  //       const totalRecords = result[0]?.total[0]?.totalRecords || 0;

  //       return {
  //         statusCode: HttpStatus.OK,
  //         message: 'Earnings of Trainer',
  //         Total: result[0]?.total[0]?.totalAmount || 0,
  //         pagination: {
  //           page: _page,
  //           limit: _limit,
  //           totalRecords,
  //           totalPages: Math.ceil(totalRecords / _limit),
  //         },
  //         data: result[0]?.data || [],
  //       };
  //     }

  //     const result = await this.earningModel.aggregate([
  //       ...basePipeline,
  //       {
  //         $facet: {
  //           data: [{ $sort: { createdAt: -1 } }],
  //           total: [
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalAmount: { $sum: '$earned_amount' },
  //               },
  //             },
  //           ],
  //         },
  //       },
  //     ]);

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Earnings of Trainer',
  //       Total: result[0]?.total[0]?.totalAmount || 0,
  //       data: result[0]?.data || [],
  //     };

  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message,
  //     };
  //   }
  // }

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
      earnings: filteredEarnings,
      bookings: filteredBookings,
      clients: clientUsers,
      trainers: trainerUsers,
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
          $addFields: {
            professional_details_arr: {
              $filter: {
                input: {
                  $split: [{ $ifNull: ['$professional_details', ''] }, ','],
                },
                as: 'item',
                cond: { $ne: ['$$item', ''] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'professional_details_arr',
            foreignField: 'yogaId',
            as: 'yoga',
          },
        },
        {
          $addFields: {
            yoga: {
              $cond: {
                if: { $gt: [{ $size: '$yoga' }, 0] },
                then: '$yoga',
                else: '$$REMOVE',
              },
            },
          },
        },
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
        const findInAppNotifications = await this.inAppNotificationModel
          .find({
            $and: [
              {
                userId: userId,
              },
              { isRead: false },
            ],
          })
          .countDocuments();

        return {
          statusCode: HttpStatus.OK,
          message: 'Trainer Details',
          unread_Notifications: findInAppNotifications,
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

        const findInAppNotifications = await this.inAppNotificationModel
          .find({
            $and: [
              {
                userId: userId,
              },
              { isRead: false },
            ],
          })
          .countDocuments();
        return {
          statusCode: HttpStatus.OK,
          message: 'Client Details',
          unread_Notifications: findInAppNotifications,
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

  async sendInAppNotificationWithRoomDetails(req: userRoomDetialsDto) {
    try {
      const userDetails = await this.userModel.findOne({ userId: req.userId });
      if (userDetails) {
        await this.sessionsService.addroomsession({
          ...req,
          clientId: req.userId,
        });
        const findBooking = await this.bookingModel.findOne({
          bookingId: req.bookingId,
        });
        const findTrainers = await this.userModel.find({
          professional_details: {
            $regex: new RegExp(`(^|,)${findBooking?.yogaId}(,|$)`),
          },
        });
        if (findBooking && findTrainers.length > 0) {
          const OrdersAlerts = findBooking?.trainerIds.map(async (trainer) => {
            await this.orderAlertModel.create({
              ...req,
              bookingId: findBooking?.bookingId,
              clientId: findBooking.clientId,
              trainerId: trainer,
              yogaId: findBooking.yogaId,
            });
          });
          if (OrdersAlerts) {
            await findTrainers.map(async (trainer) => {
              const addNotification =
                await this.inappNotificationService.addInAppBookingNotification(
                  {
                    ...req,
                    userId: trainer.userId,
                    message:
                      'There is a new yoga session booking. Please checkout.',
                    type: 'booking',
                    bookingId: req.bookingId,
                  },
                );
              if (addNotification) {
                await this.inAppNotificationModel.updateOne(
                  {
                    inapp_notification_id:
                      addNotification.data?.inapp_notification_id,
                  },
                  {
                    $set: {
                      status: 'success',
                    },
                  },
                );
              }
            });
          }
          return {
            statusCode: HttpStatus.OK,
            message: 'Sent Notifications to trainers',
          };
        } else {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'No Trainers Available for this yoga',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  private getDateRange(dto: GetEarningsDto): { start: Date; end: Date } {
    const today = new Date();

    const IST_OFFSET_MS = this.IST_OFFSET_MS;

    const toISTStartOfDay = (dateStr: string): Date => {
      return new Date(`${dateStr}T00:00:00.000+05:30`);
    };

    const toISTEndOfDay = (dateStr: string): Date => {
      return new Date(`${dateStr}T23:59:59.999+05:30`);
    };

    const fmt = (d: Date): string => {
      const istDate = new Date(d.getTime() + IST_OFFSET_MS);
      return istDate.toISOString().split('T')[0];
    };

    const subtractDays = (days: number): Date => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      const istDateStr = fmt(d);
      return toISTStartOfDay(istDateStr);
    };

    const todayISTStr = fmt(today);

    const getFYRange = (fyString: string): { start: Date; end: Date } => {
      if (fyString === 'current_fy') {
        const month = today.getMonth();
        const year = today.getFullYear();
        const fyStartYear = month >= 3 ? year : year - 1;
        return {
          start: toISTStartOfDay(`${fyStartYear}-04-01`),
          end: toISTEndOfDay(`${fyStartYear + 1}-03-31`),
        };
      }
      const [startYear, endYear] = fyString.split('-').map(Number);
      return {
        start: toISTStartOfDay(`${startYear}-04-01`),
        end: toISTEndOfDay(`${endYear}-03-31`),
      };
    };

    const { period, startDate, endDate } = dto;

    switch (period) {
      case '30':
        return { start: subtractDays(30), end: toISTEndOfDay(todayISTStr) };
      case '90':
        return { start: subtractDays(90), end: toISTEndOfDay(todayISTStr) };
      case '180':
        return { start: subtractDays(180), end: toISTEndOfDay(todayISTStr) };
      case '365':
        return { start: subtractDays(365), end: toISTEndOfDay(todayISTStr) };

      case 'current_fy':
      case '2024-2025':
      case '2023-2024':
      case '2022-2023':
      case '2021-2022':
        return getFYRange(period);

      case 'custom':
        if (!startDate || !endDate) {
          throw new BadRequestException(
            'startDate and endDate are required for custom range',
          );
        }
        return {
          start: toISTStartOfDay(startDate),
          end: toISTEndOfDay(endDate),
        };

      default:
        throw new BadRequestException(
          'Invalid period. Use 30, 90, 180, 365, custom, current_fy, or a financial year like 2024-2025',
        );
    }
  }

  async getEarningsForDownload(dto: GetEarningsDto) {
    const { trainerId } = dto;
    const { start, end } = this.getDateRange(dto);

    // Step 1: Fetch only earningId and date for this trainer — lightweight query
    const allEarnings = await this.earningModel
      .find({ trainerId })
      .select('earningId date')
      .lean();

    // Step 2: Filter by date range in Node.js
    // Node.js V8 correctly parses "Fri Feb 13 2026 05:30:00 GMT+0530 (India Standard Time)"
    // Both sides are now in UTC so comparison is accurate
    const validEarningIds = allEarnings
      .filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      })
      .map((e) => e.earningId);

    // Step 3: Early return if no records found
    if (validEarningIds.length === 0) {
      return {
        success: true,
        meta: {
          trainerId,
          period: dto.period,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          totalEarned: 0,
          totalSessions: 0,
        },
        dailyBreakdown: {},
        records: [],
      };
    }

    // Step 4: Full aggregation with lookups only for matched records
    const earnings = await this.earningModel.aggregate([
      {
        $match: {
          trainerId,
          earningId: { $in: validEarningIds },
        },
      },

      // Populate Booking
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: 'bookingId',
          as: 'bookingId',
        },
      },
      { $unwind: { path: '$bookingId', preserveNullAndEmptyArrays: true } },

      // Populate Trainer
      {
        $lookup: {
          from: 'users',
          localField: 'trainerId',
          foreignField: 'userId',
          as: 'trainerId',
        },
      },
      { $unwind: { path: '$trainerId', preserveNullAndEmptyArrays: true } },

      // Populate Client
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: 'userId',
          as: 'clientId',
        },
      },
      { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

      // Populate Yoga
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
        $project: {
          _id: 0,
          earningId: 1,
          date: 1,
          earned_amount: 1,
          'bookingId.bookingId': 1,
          'bookingId.status': 1,
          'bookingId.scheduledDate': 1,
          'clientId.userId': 1,
          'clientId.name': 1,
          'clientId.email': 1,
          'yogaId.yogaId': 1,
          'yogaId.yoga_name': 1,
          'yogaId.duration': 1,
        },
      },

      { $sort: { date: -1 } },
    ]);

    // Step 5: Compute summary stats
    const totalEarned = earnings.reduce(
      (sum, e) => sum + (e.earned_amount || 0),
      0,
    );
    const totalSessions = earnings.length;

    // Step 6: Daily breakdown — normalize IST date string to YYYY-MM-DD
    const dailyBreakdown: {
      [key: string]: { totalEarned: number; sessions: number };
    } = {};

    for (const e of earnings) {
      // Convert "Fri Feb 13 2026 05:30:00 GMT+0530..." to "2026-02-13" in IST
      const parsedDate = new Date(e.date);
      const istDate = new Date(parsedDate.getTime() + this.IST_OFFSET_MS);
      const key = istDate.toISOString().split('T')[0];

      if (!dailyBreakdown[key]) {
        dailyBreakdown[key] = { totalEarned: 0, sessions: 0 };
      }
      dailyBreakdown[key].totalEarned += e.earned_amount || 0;
      dailyBreakdown[key].sessions += 1;
    }

    return {
      success: true,
      meta: {
        trainerId,
        period: dto.period,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalEarned,
        totalSessions,
      },
      dailyBreakdown,
      records: earnings,
    };
  }

  // async addOrderAlerts(req: orderAlertDto) {
  //   try {
  //     const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  //     const getOrderAlert = await this.orderAlertModel.aggregate([
  //       {
  //         $match: {
  //           trainerId: req.trainerId,
  //           createdAt: { $gte: tenMinutesAgo },
  //         },
  //       },
  //       { $sort: { createdAt: -1 } },
  //       { $limit: 1 },

  //       {
  //         $lookup: {
  //           from: 'bookings',
  //           localField: 'bookingId',
  //           foreignField: 'bookingId',
  //           as: 'bookingId',
  //         },
  //       },
  //       { $unwind: { path: '$bookingId', preserveNullAndEmptyArrays: true } },

  //       {
  //         $lookup: {
  //           from: 'roomsessions',
  //           localField: 'bookingId.bookingId',
  //           foreignField: 'bookingId',
  //           as: 'room_details',
  //         },
  //       },
  //       {
  //         $unwind: { path: '$room_details', preserveNullAndEmptyArrays: true },
  //       },

  //       {
  //         $lookup: {
  //           from: 'yogadetails',
  //           localField: 'bookingId.yogaId',
  //           foreignField: 'yogaId',
  //           as: 'yogaId',
  //         },
  //       },
  //       { $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true } },

  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'bookingId.clientId',
  //           foreignField: 'userId',
  //           as: 'clientId',
  //         },
  //       },
  //       { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

  //       // ✅ NEW LOGIC STARTS HERE
  //       {
  //         $lookup: {
  //           from: 'passedorders',
  //           let: {
  //             trainerId: '$trainerId',
  //             bookingId: '$bookingId.bookingId',
  //           },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $eq: ['$trainerId', '$$trainerId'] },
  //                     { $eq: ['$bookingId', '$$bookingId'] },
  //                   ],
  //                 },
  //               },
  //             },
  //           ],
  //           as: 'passedOrderCheck',
  //         },
  //       },

  //       // ❌ If exists in passed_orders → remove
  //       {
  //         $match: {
  //           passedOrderCheck: { $size: 0 },
  //         },
  //       },
  //       // ✅ NEW LOGIC ENDS HERE

  //       {
  //         $project: {
  //           bookingId: '$bookingId',
  //           yoga_details: '$yogaId',
  //           client_details: '$clientId',
  //           room_details: '$room_details',
  //           status: 1,
  //           alertId: 1,
  //           createdAt: 1,
  //           updatedAt: 1,
  //         },
  //       },
  //     ]);

  //     return {
  //       status: HttpStatus.OK,
  //       message: 'Order Alert Details',
  //       data: getOrderAlert[0] || {},
  //     };
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message,
  //     };
  //   }
  // }

  async addOrderAlerts(req: orderAlertDto) {
    try {
      const now = new Date();
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

      const nowTotalSecondsIST =
        nowIST.getUTCHours() * 3600 +
        nowIST.getUTCMinutes() * 60 +
        nowIST.getUTCSeconds();

      const fiveMinInSeconds = 5 * 60;

      // ✅ Today's date as "Mar 26 2026" to match against stored string
      // stored format: "Thu Mar 26 2026 00:00:00 GMT+0000 ..."
      // substring from index 4 to 15 gives "Mar 26 2026"
      const todayIST = nowIST.toUTCString(); // "Thu, 26 Mar 2026 16:40:23 GMT"
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
      const monthStr = months[nowIST.getUTCMonth()];
      const dayStr = String(nowIST.getUTCDate()).padStart(2, ' ');
      const yearStr = String(nowIST.getUTCFullYear());

      // This matches the stored string format: "Thu Mar 26 2026 ..."
      //                                              ^4  ^8  ^11
      const todayMatchStr = `${monthStr} ${nowIST.getUTCDate()} ${yearStr}`;
      // e.g. "Mar 26 2026"

      console.log('todayMatchStr:', todayMatchStr);
      console.log(
        'nowTotalSecondsIST:',
        nowTotalSecondsIST,
        '→',
        `${nowIST.getUTCHours()}:${nowIST.getUTCMinutes()}:${nowIST.getUTCSeconds()}`,
      );
      console.log(
        'window seconds:',
        nowTotalSecondsIST - fiveMinInSeconds,
        'to',
        nowTotalSecondsIST + fiveMinInSeconds,
      );

      const trainer = await this.userModel.findOne({ userId: req.trainerId });

      if (!trainer || !trainer?.istrainerOn) {
        return {
          status: HttpStatus.OK,
          message: 'Trainer is currently offline',
          data: {},
        };
      }

      const getOrderAlert = await this.orderAlertModel.aggregate([
        {
          $match: {
            trainerId: req.trainerId,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },

        // Lookup booking
        {
          $lookup: {
            from: 'bookings',
            localField: 'bookingId',
            foreignField: 'bookingId',
            as: 'bookingId',
          },
        },
        { $unwind: { path: '$bookingId', preserveNullAndEmptyArrays: true } },

        // ✅ Fix: since scheduledDate is a string like "Thu Mar 26 2026 00:00:00 GMT+0000 ..."
        // extract substring from index 4 (length 11) → "Mar 26 2026"
        // and match against today's date string built in JS
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $substr: ['$bookingId.scheduledDate', 4, 11],
                },
                todayMatchStr, // e.g. "Mar 26 2026"
              ],
            },
          },
        },

        // ✅ Parse time "HH:MM:SS" into total seconds
        {
          $addFields: {
            bookingTotalSeconds: {
              $add: [
                {
                  $multiply: [
                    {
                      $toInt: {
                        $arrayElemAt: [{ $split: ['$bookingId.time', ':'] }, 0],
                      },
                    },
                    3600,
                  ],
                },
                {
                  $multiply: [
                    {
                      $toInt: {
                        $arrayElemAt: [{ $split: ['$bookingId.time', ':'] }, 1],
                      },
                    },
                    60,
                  ],
                },
                {
                  $toInt: {
                    $arrayElemAt: [{ $split: ['$bookingId.time', ':'] }, 2],
                  },
                },
              ],
            },
          },
        },

        // ✅ Filter: booking time must be within ±5 mins of now (IST)
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$bookingTotalSeconds',
                    nowTotalSecondsIST - fiveMinInSeconds,
                  ],
                },
                {
                  $lte: [
                    '$bookingTotalSeconds',
                    nowTotalSecondsIST + fiveMinInSeconds,
                  ],
                },
              ],
            },
          },
        },

        // Lookup room sessions
        {
          $lookup: {
            from: 'roomsessions',
            localField: 'bookingId.bookingId',
            foreignField: 'bookingId',
            as: 'room_details',
          },
        },
        {
          $unwind: { path: '$room_details', preserveNullAndEmptyArrays: true },
        },

        // Lookup yoga details
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'bookingId.yogaId',
            foreignField: 'yogaId',
            as: 'yogaId',
          },
        },
        { $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true } },

        // Lookup client/user details
        {
          $lookup: {
            from: 'users',
            localField: 'bookingId.clientId',
            foreignField: 'userId',
            as: 'clientId',
          },
        },
        { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },

        // Passed order check
        {
          $lookup: {
            from: 'passedorders',
            let: {
              trainerId: '$trainerId',
              bookingId: '$bookingId.bookingId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$trainerId', '$$trainerId'] },
                      { $eq: ['$bookingId', '$$bookingId'] },
                    ],
                  },
                },
              },
            ],
            as: 'passedOrderCheck',
          },
        },

        // Exclude if already in passed orders
        {
          $match: {
            passedOrderCheck: { $size: 0 },
          },
        },

        {
          $project: {
            bookingId: '$bookingId',
            yoga_details: '$yogaId',
            client_details: '$clientId',
            room_details: '$room_details',
            status: 1,
            alertId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return {
        status: HttpStatus.OK,
        message: 'Order Alert Details',
        data: getOrderAlert[0] || {},
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  // cancel order for test mode
  async cancelOrder(req: bookingDto) {
    try {
      const booking = await this.bookingModel.findOne({
        bookingId: req.bookingId,
      });

      if (!booking) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Booking not found',
        };
      }

      if (booking.status === 'cancelled') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Booking already cancelled',
        };
      }

      let refundResult;
      const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

      if (booking.transactionId && booking.transactionId !== 'NA') {
        try {
          const paymentDetails = await this.razorpay.payments.fetch(
            booking.transactionId,
          );

          console.log('Payment status for refund:', {
            status: paymentDetails.status,
            method: paymentDetails.method,
            amount: paymentDetails.amount,
          });

          // ✅ Case 1: Payment is still authorized (never captured)
          // Cannot refund — must cancel/void it differently
          if (paymentDetails.status === 'authorized') {
            if (isTestMode) {
              // In test mode — simulate refund, skip API call
              console.log(
                'TEST MODE: Payment still authorized, simulating void/refund',
              );
              refundResult = {
                id: `test_void_${Date.now()}`,
                status: 'test_simulated',
                amount: paymentDetails.amount,
                note: 'Authorized payment voided in test mode',
              };
            } else {
              // In live mode — UPI authorized payments auto-expire after 5 days
              // For cards, you can attempt refund on authorized payment
              try {
                refundResult = await this.razorpay.payments.refund(
                  booking.transactionId,
                  { amount: Number(paymentDetails.amount) },
                );
              } catch (voidErr) {
                // If refund on authorized fails, just cancel the booking
                console.warn(
                  'Refund on authorized payment failed:',
                  voidErr?.error?.description,
                );
                refundResult = {
                  id: null,
                  status: 'void_failed',
                  note: 'Payment will auto-expire',
                };
              }
            }
          }

          // ✅ Case 2: Payment is captured — normal refund flow
          else if (paymentDetails.status === 'captured') {
            if (isTestMode && paymentDetails.method === 'upi') {
              // Test mode UPI captured — simulate refund
              console.log(
                'TEST MODE: UPI captured payment - simulating refund',
              );
              refundResult = {
                id: `test_refund_${Date.now()}`,
                status: 'test_simulated',
                amount: paymentDetails.amount,
                method: 'upi',
                note: 'Simulated in test mode — use Razorpay dashboard to issue actual refund',
              };
            } else {
              // ✅ Live mode or non-UPI test — actual refund
              refundResult = await this.razorpay.payments.refund(
                booking.transactionId,
                { amount: Number(paymentDetails.amount) },
              );
              console.log('Refund successful:', refundResult);
            }
          }

          // ✅ Case 3: Already refunded
          else if (paymentDetails.status === 'refunded') {
            console.log('Payment already refunded, just cancelling booking');
            refundResult = { id: null, status: 'already_refunded' };
          }

          // ✅ Case 4: Failed/other status
          else {
            console.log(
              `Payment in '${paymentDetails.status}' status, skipping refund`,
            );
            refundResult = { id: null, status: paymentDetails.status };
          }
        } catch (refundError) {
          console.error(
            'Razorpay refund error:',
            JSON.stringify(refundError, null, 2),
          );
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: `Refund failed: ${refundError?.error?.description || refundError.message}`,
            debug: refundError?.error || refundError.message,
          };
        }
      } else {
        console.log('No valid transactionId found, skipping refund');
      }

      // ✅ Cancel the booking regardless of refund outcome
      const cancel_booking = await this.bookingModel.updateOne(
        { bookingId: req.bookingId },
        {
          $set: {
            status: 'cancelled',
            refundId: refundResult?.id || null,
            refundStatus: refundResult?.status || null,
          },
        },
      );

      await this.orderAlertModel.updateMany(
        { bookingId: req.bookingId },
        { $set: { status: 'cancelled' } },
      );

      if (cancel_booking.modifiedCount > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: isTestMode
            ? 'Order cancelled. Refund simulated in test mode — use Razorpay dashboard for actual refund.'
            : 'Order cancelled and refund initiated successfully.',
          refundId: refundResult?.id || null,
          refundStatus: refundResult?.status || null,
          ...(isTestMode && { debug: refundResult }),
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to cancel order',
        };
      }
    } catch (error) {
      console.error('cancelOrder error:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  // cancel order for live mode
  // async cancelOrder(req: bookingDto) {
  //   try {
  //     const booking = await this.bookingModel.findOne({
  //       bookingId: req.bookingId,
  //     });

  //     if (!booking) {
  //       return {
  //         statusCode: HttpStatus.NOT_FOUND,
  //         message: 'Booking not found',
  //       };
  //     }

  //     if (booking.status === 'cancelled') {
  //       return {
  //         statusCode: HttpStatus.CONFLICT,
  //         message: 'Booking already cancelled',
  //       };
  //     }

  //     let refundResult;
  //     const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

  //     if (booking.transactionId && booking.transactionId !== 'NA') {
  //       try {
  //         const paymentDetails = await this.razorpay.payments.fetch(
  //           booking.transactionId,
  //         );

  //         console.log('Payment status for cancel:', {
  //           status: paymentDetails.status,
  //           method: paymentDetails.method,
  //           amount: paymentDetails.amount,
  //           isTestMode,
  //         });

  //         if (paymentDetails.status === 'captured') {
  //           if (isTestMode && paymentDetails.method === 'upi') {
  //             // ✅ Test mode UPI — simulate refund
  //             console.log('TEST MODE UPI: Simulating refund');
  //             refundResult = {
  //               id: `test_refund_${Date.now()}`,
  //               status: 'test_simulated',
  //               amount: paymentDetails.amount,
  //               note: 'Use Razorpay dashboard to issue actual refund in test mode',
  //             };
  //           } else {
  //             // ✅ Live mode — real refund
  //             console.log('LIVE MODE: Initiating real refund...');
  //             refundResult = await this.razorpay.payments.refund(
  //               booking.transactionId,
  //               { amount: Number(paymentDetails.amount) },
  //             );
  //             console.log('Refund successful:', {
  //               id: refundResult.id,
  //               status: refundResult.status,
  //               amount: refundResult.amount,
  //             });
  //           }
  //         } else if (paymentDetails.status === 'authorized') {
  //           // ✅ Payment was never captured — nothing to refund
  //           // In live mode authorized payments auto-expire after 5 days
  //           console.log(
  //             'Payment is authorized (not captured) — no refund needed, will auto-expire.',
  //           );
  //           refundResult = {
  //             id: null,
  //             status: 'authorized_not_captured',
  //             note: 'Payment was never captured, will auto-expire in 5 days',
  //           };
  //         } else if (paymentDetails.status === 'refunded') {
  //           console.log('Payment already refunded.');
  //           refundResult = { id: null, status: 'already_refunded' };
  //         } else {
  //           console.log(
  //             `Payment in '${paymentDetails.status}' — skipping refund.`,
  //           );
  //           refundResult = { id: null, status: paymentDetails.status };
  //         }
  //       } catch (refundError) {
  //         console.error(
  //           'Razorpay refund error:',
  //           JSON.stringify(refundError, null, 2),
  //         );
  //         return {
  //           statusCode: HttpStatus.EXPECTATION_FAILED,
  //           message: `Refund failed: ${refundError?.error?.description || refundError.message}`,
  //           debug: refundError?.error || refundError.message,
  //         };
  //       }
  //     } else {
  //       console.log('No valid transactionId — skipping refund.');
  //     }

  //     // ✅ Always cancel the booking regardless of refund outcome
  //     const cancel_booking = await this.bookingModel.updateOne(
  //       { bookingId: req.bookingId },
  //       {
  //         $set: {
  //           status: 'cancelled',
  //           refundId: refundResult?.id || null,
  //           refundStatus: refundResult?.status || null,
  //         },
  //       },
  //     );

  //     await this.orderAlertModel.updateMany(
  //       { bookingId: req.bookingId },
  //       { $set: { status: 'cancelled' } },
  //     );

  //     if (cancel_booking.modifiedCount > 0) {
  //       return {
  //         statusCode: HttpStatus.OK,
  //         message: 'Order cancelled and refund initiated successfully.',
  //         refundId: refundResult?.id || null,
  //         refundStatus: refundResult?.status || null,
  //       };
  //     } else {
  //       return {
  //         statusCode: HttpStatus.EXPECTATION_FAILED,
  //         message: 'Failed to cancel order',
  //       };
  //     }
  //   } catch (error) {
  //     console.error('cancelOrder error:', error);
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message,
  //     };
  //   }
  // }
}
