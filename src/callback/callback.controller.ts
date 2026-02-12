import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { callRequestDto } from './dto/callback.dto';

@Controller('callback')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post('/add')
  async addCallRequest(@Body() req: callRequestDto) {
    try{
      const addcall = await this.callbackService.createRequest(req);
      return addcall
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @Get('/')
  async getCallRequest(@Query('page') page = 10, @Query('limit') limit = 10) {
    try{
      const getlist = await this.callbackService.getCallRequest(
        Number(page),
        Number(limit)
      );
      return getlist
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @Post('/completeRequest')
  async completeRequest(@Body() req: callRequestDto) {
    try{
      const completecall = await this.callbackService.completeRequest(req);
      return completecall
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }
}
