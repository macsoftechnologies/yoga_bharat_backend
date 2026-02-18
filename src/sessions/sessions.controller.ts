import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { sessionRoomsDto } from './dto/sessions.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('/add')
  async addSession(@Body() req: sessionRoomsDto) {
    try {
      const add = await this.sessionsService.addroomsession(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
