import { Body, Controller, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { fcmDto } from './dto/fcm.dto';
import { notificationsDto } from './dto/notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtGuard)
  @Post('fcm-token')
  async registerFcmToken(@Body() body: fcmDto) {
    return await this.notificationsService.saveFcmToken(body);
  }

  @Post('/removefcm')
  async removeFCMToken(@Body() req: fcmDto) {
    return await this.notificationsService.removeFcmToken(req.userId, req.deviceId);
  }

  @Post('/addbulksms')
  async sendUserBulkSMS(@Body() req: notificationsDto) {
    try{
      const addnotification = await this.notificationsService.createNotification(req);
      return addnotification
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }
}
