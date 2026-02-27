import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { PassedOrdersService } from './passed_orders.service';
import { passedOrdersDto } from './dto/passed_orders.dto';

@Controller('passed-orders')
export class PassedOrdersController {
  constructor(private readonly passedOrdersService: PassedOrdersService) {}

  @Post('/add')
  async addPassedOrder(@Body() req: passedOrdersDto) {
    try{
      const add = await this.passedOrdersService.createPassedOrder(req);
      return add
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }

  @Post('/')
  async getUserPassedOrder(@Body() req: passedOrdersDto) {
    try{
      const List = await this.passedOrdersService.getTrainerPassedOrdersList(req);
      return List
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }
}
