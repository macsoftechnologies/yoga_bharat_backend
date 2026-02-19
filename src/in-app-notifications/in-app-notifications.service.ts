import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InAppNotifications } from './schema/inapp.schema';
import { Model } from 'mongoose';
import { inAppNotificationsDto } from './dto/inapp.dto';
import { inAppBookingNotificationsDto } from './dto/inapp-notifications-booking.dto';

@Injectable()
export class InAppNotificationsService {
  constructor(
    @InjectModel(InAppNotifications.name)
    private readonly inappNotificationsModel: Model<InAppNotifications>,
  ) {}

  async addInAppBookingNotification(req: Partial<inAppBookingNotificationsDto>) {
    try {
      const add = await this.inappNotificationsModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'In App Notifications Added successfully',
          data: add
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'failed to add notification',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async addInAppNotification(req: Partial<inAppNotificationsDto>) {
    try {
      const add = await this.inappNotificationsModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'In App Notification added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'failed to add In App Notification',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getUserNotifications(userId) {
    try {
        const updateNotifications = await this.inappNotificationsModel.updateMany({userId: userId},{
          $set: {
            isRead: true
          }
        });
      const getnotifications = await this.inappNotificationsModel.find({
        userId: userId,
      });
      if (getnotifications.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'In App Notifications List of user',
          data: getnotifications,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'In App Notifications not found',
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
