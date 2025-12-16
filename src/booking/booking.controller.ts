import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { bookingDto } from './dto/booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('/createbooking')
  async addBooking(@Body() req: bookingDto) {
    try {
      const booking = await this.bookingService.createBooking(req);
      return booking;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Get('/filterlist')
  getBookings(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query() query,
  ) {
    return this.bookingService.getBookings(Number(page), Number(limit), {
      clientId: query.clientId,
      accepted_trainerId: query.accepted_trainerId,
      status: query.status,
      yogaId: query.yogaId,
      bookingId: query.bookingId
    });
  }

  @Post('/delete')
  async removeBooking(@Body() req: bookingDto) {
    try{
      const removebooking = await this.bookingService.deleteBooking(req);
      return removebooking
    } catch(error){
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @Post('/accept')
  async acceptbooking(@Body() req: bookingDto) {
    try{
      const accept = await this.bookingService.acceptBooking(req);
      return accept
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      }
    }
  }
}
