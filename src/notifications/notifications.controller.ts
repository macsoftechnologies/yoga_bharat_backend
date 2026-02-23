import { Body, Controller, Get, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @Get('/sms')
  async getSMSNotificationsList(@Query('page') page = 10, @Query('limit') limit = 10) {
    try{
      const getlist = await this.notificationsService.getNotificationsList(
        Number(page),
        Number(limit),
      );
      return getlist
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }
}
