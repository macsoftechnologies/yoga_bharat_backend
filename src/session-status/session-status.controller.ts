import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { SessionStatusService } from './session-status.service';
import { sessionStatusDto } from './dto/session_status.dto';

@Controller('session-status')
export class SessionStatusController {
  constructor(private readonly sessionStatusService: SessionStatusService) {}

  @Post('/update')
  async updateSessionStatus(@Body() req: sessionStatusDto) {
    try {
      const updatesession =
        await this.sessionStatusService.updateSessionStatus(req);
      return updatesession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
      };
    }
  }

  @Post('/details')
  async getSessionStatus(@Body() req: sessionStatusDto) {
    try {
      const updatesession = await this.sessionStatusService.getDetails(req);
      return updatesession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
      };
    }
  }
}
