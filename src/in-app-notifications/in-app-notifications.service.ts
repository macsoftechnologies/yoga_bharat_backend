import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InAppNotifications } from './schema/inapp.schema';
import { Model } from 'mongoose';
import { inAppNotificationsDto } from './dto/inapp.dto';
import { inAppBookingNotificationsDto } from './dto/inapp-notifications-booking.dto';
import { User } from 'src/users/schema/user.schema';
import { sendExpoPushNotification } from '../notifications/utils/expo-notifications';

@Injectable()
export class InAppNotificationsService {
  constructor(
    @InjectModel(InAppNotifications.name)
    private readonly inappNotificationsModel: Model<InAppNotifications>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async addInAppBookingNotification(req: Partial<inAppBookingNotificationsDto>) {
    try {
      const add = await this.inappNotificationsModel.create(req);
      if (add) {
        // Send Expo Push Notification in the background safely
        const { userId, message } = req;
        if (userId && message) {
          this.userModel
            .findOne({ userId })
            .select('fcm_token')
            .lean()
            .then((user) => {
              if (user && user.fcm_token) {
                sendExpoPushNotification(user.fcm_token, 'New Booking Update', message).catch(
                  (err) => console.error('Background Expo push error:', err),
                );
              }
            })
            .catch((err) => console.error('Error fetching user for push:', err));
        }

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
        // Send Expo Push Notification in the background safely
        const { userId, message } = req;
        if (userId && message) {
          this.userModel
            .findOne({ userId })
            .select('fcm_token')
            .lean()
            .then((user) => {
              if (user && user.fcm_token) {
                sendExpoPushNotification(user.fcm_token, 'Yoga Bharat Update', message).catch(
                  (err) => console.error('Background Expo push error:', err),
                );
              }
            })
            .catch((err) => console.error('Error fetching user for push:', err));
        }

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
        const getUser = await this.userModel.findOne({userId: userId});
        return {
          statusCode: HttpStatus.OK,
          message: 'In App Notifications List of user',
          userRole: getUser?.role,
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
