import { Injectable } from '@nestjs/common';
import { fcmDto } from './dto/fcm.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FCMTokens } from './schema/fcm.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(FCMTokens.name)
    private readonly fcmTokenModel: Model<FCMTokens>,
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
}
