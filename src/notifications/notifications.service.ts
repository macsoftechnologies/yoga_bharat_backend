import { HttpStatus, Injectable } from '@nestjs/common';
import { fcmDto } from './dto/fcm.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FCMTokens } from './schema/fcm.schema';
import { Notifications } from './schema/notifications.schema';
import { SMSService } from 'src/auth/sms.service';
import { User } from 'src/users/schema/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(FCMTokens.name)
    private readonly fcmTokenModel: Model<FCMTokens>,
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<Notifications>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly smsService: SMSService,
  ) {}

  async saveFcmToken(dto: fcmDto) {
    try {
      const findFCM = await this.fcmTokenModel.findOne({ userId: dto.userId });
      if (findFCM) {
        return this.fcmTokenModel.findOneAndUpdate(
          { fcmToken: dto.fcmToken },
          {
            userId: dto.userId,
            deviceType: dto.deviceType,
            deviceId: dto.deviceId,
          },
          { upsert: true, new: true },
        );
      } else {
        return await this.fcmTokenModel.create(dto);
      }
    } catch (error) {
      return error.message;
    }
  }

  async removeFcmToken(userId: string, deviceId: string) {
    return this.fcmTokenModel.deleteOne({ userId, deviceId });
  }

  async createNotification(req: { userId: string[]; message: string }) {
    try {
      const users = await this.userModel
        .find({ userId: { $in: req.userId } })
        .select('mobileNumber')
        .lean();

      if (!users || users.length === 0) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No users found',
        };
      }

      const createNotification = await this.notificationModel.create({
        userId: req.userId,
        message: req.message,
      });

      if (!createNotification) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to create notification',
        };
      }

      const mobileNumbers = users.map((user) => user.mobileNumber);
      const smsSent = await this.smsService.sendBulkSms(
        mobileNumbers,
        req.message,
      );

      if (!smsSent) {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Notification created but failed to send SMS',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: `Notification created and SMS sent to ${users.length} users`,
        data: createNotification,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
