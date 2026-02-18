import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { inAppBookingNotificationsDto } from './dto/inapp-notifications-booking.dto';
import { inAppNotificationsDto } from './dto/inapp.dto';

@Controller('in-app-notifications')
export class InAppNotificationsController {
  constructor(
    private readonly inAppNotificationsService: InAppNotificationsService,
  ) {}

  @Post('/addinappbookingnotification')
  async addBookingInAppNotification(@Body() req: inAppBookingNotificationsDto) {
    try {
      const add =
        await this.inAppNotificationsService.addInAppBookingNotification(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  @Post('/addinappnotification')
  async addInAppNotification(@Body() req: inAppNotificationsDto) {
    try {
      const add =
        await this.inAppNotificationsService.addInAppNotification(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  @Get('/')
  async inAppNotificationList(@Query('userId') userId: string) {
    try {
      const add = await this.inAppNotificationsService.getUserNotifications(
        String(userId),
      );
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
