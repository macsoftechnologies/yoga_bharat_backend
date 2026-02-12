import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CallRequest } from './schema/callback.schema';
import { Model } from 'mongoose';
import { callRequestDto } from './dto/callback.dto';
import { CallRequestStatus } from 'src/auth/guards/roles.enum';

@Injectable()
export class CallbackService {
  constructor(
    @InjectModel(CallRequest.name)
    private readonly callRequestModel: Model<CallRequest>,
  ) {}

  async createRequest(req: callRequestDto) {
    try {
      const now = new Date();
      const addcallrequest = await this.callRequestModel.create({
        ...req,
        date: now.toLocaleDateString(),
      });
      if (addcallrequest) {
        return {
          statusCode: HttpStatus.OK,
          message: 'CallRequest added',
          data: addcallrequest,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add call request',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getCallRequest(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const getlist = await this.callRequestModel.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'userId',
            as: 'userId',
          },
        },
        { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'admins',
            localField: 'adminId',
            foreignField: 'adminId',
            as: 'adminId',
          },
        },
        { $unwind: { path: '$adminId', preserveNullAndEmptyArrays: true } },
        { $skip: skip },
        { $limit: limit },
      ]);
      const totalCount = await this.callRequestModel.countDocuments();
      if (getlist.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Call Requests List',
          currentPage: page,
          limit: limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          data: getlist,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Call Requests Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async completeRequest(req: callRequestDto) {
    try {
      const updatestatus = await this.callRequestModel.updateOne(
        { callRequestId: req.callRequestId },
        {
          $set: {
            status: CallRequestStatus.COMPLETED,
            adminId: req.adminId,
          },
        },
      );
      if (updatestatus) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Call Request Completed',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Call Request not completed',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
