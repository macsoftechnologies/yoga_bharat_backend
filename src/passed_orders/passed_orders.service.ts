import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassedOrders } from './schema/passed_orders.schema';
import { Model } from 'mongoose';
import { passedOrdersDto } from './dto/passed_orders.dto';

@Injectable()
export class PassedOrdersService {
  constructor(
    @InjectModel(PassedOrders.name)
    private readonly passedOrdersModel: Model<PassedOrders>,
  ) {}

  async createPassedOrder(req: passedOrdersDto) {
    try {
      const add = await this.passedOrdersModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Passed Order Added successfully',
          data: add,
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
        message: error.message,
      };
    }
  }

  async getTrainerPassedOrdersList(req: passedOrdersDto) {
    try {
      const getlist = await this.passedOrdersModel.aggregate([
        { $match: { trainerId: req.trainerId } },
        {
          $lookup: {
            from: 'bookings',
            localField: 'bookingId',
            foreignField: 'bookingId',
            as: 'bookingId',
          },
        },
        { $unwind: { path: '$bookingId', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'bookingId.yogaId',
            foreignField: 'yogaId',
            as: 'yoga_details',
          },
        },
        {
          $unwind: { path: '$yoga_details', preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'bookingId.clientId',
            foreignField: 'userId',
            as: 'client_details',
          },
        },
        {
          $unwind: { path: '$client_details', preserveNullAndEmptyArrays: true },
        },

        {
          $project: {
            bookingId: '$bookingId',
            yoga_details: '$yoga_details',
            client_details: '$client_details',
          },
        },
      ]);
      if (getlist.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'List of Passed orders',
          data: getlist,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No passed orders found',
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
