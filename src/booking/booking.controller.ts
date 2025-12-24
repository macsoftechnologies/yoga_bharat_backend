import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { bookingDto } from './dto/booking.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard)
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

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
