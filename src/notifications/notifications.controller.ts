import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { fcmDto } from './dto/fcm.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtGuard)
  @Post('fcm-token')
  registerFcmToken(@Body() body: fcmDto) {
    return this.notificationsService.saveFcmToken(body);
  }
}
