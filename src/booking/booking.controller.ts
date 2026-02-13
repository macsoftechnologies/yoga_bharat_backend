import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { bookingDto } from './dto/booking.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';
import { earningDto } from './dto/earnings.dto';
import { MonthlyBookingsResponseDto } from './dto/monthlybooking.dto';
import { MonthlyEarningsResponseDto } from './dto/monthlymyearning.dto';
import { YogaBookingsResponseDto } from './dto/yogabookings.dto';
import { DashboardStatsDto } from './dto/Dashboardstats.dto';

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
  @Post('/filterlist')
  getBookings(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() query,
  ) {
    return this.bookingService.getBookings(Number(page), Number(limit), {
      clientId: query.clientId,
      accepted_trainerId: query.accepted_trainerId,
      status: query.status,
      yogaId: query.yogaId,
      bookingId: query.bookingId,
      scheduledDate: query.scheduledDate,
      time: query.time,
      bookingType: query.bookingType,
    });
  }

  @UseGuards(JwtGuard)
  @Post('/delete')
  async removeBooking(@Body() req: bookingDto) {
    try {
      const removebooking = await this.bookingService.deleteBooking(req);
      return removebooking;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/accept')
  async acceptbooking(@Body() req: bookingDto) {
    try {
      const accept = await this.bookingService.acceptBooking(req);
      return accept;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/addearning')
  async addEarning(@Body() req: earningDto) {
    try {
      const add = await this.bookingService.addEarning(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/gettrainerearning')
  async getTrainerEarning(@Body() req: earningDto) {
    try {
      const add = await this.bookingService.getEarnings(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/gettrainermonthlyearning')
  async getTrainerMonthlyEarning(@Body() req: earningDto) {
    try {
      const add = await this.bookingService.getCurrentMonthEarnings(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Get('monthly-stats')
  async getMonthlyBookingStats(
    @Query('year') year?: string,
  ): Promise<MonthlyBookingsResponseDto> {
    const yearNumber = year ? parseInt(year, 10) : undefined;
    const data = await this.bookingService.getMonthlyBookingStats(yearNumber);

    const total = data.reduce((sum, item) => sum + item.bookingCount, 0);

    return {
      data,
      total,
    };
  }

  @Get('monthly-myearning-stats')
  async getMonthlyEarningsStats(
    @Query('year') year?: string,
  ): Promise<MonthlyEarningsResponseDto> {
    const yearNumber = year ? parseInt(year, 10) : undefined;
    const data = await this.bookingService.getMonthlyEarningsStats(yearNumber);

    const totalTransactions = data.reduce(
      (sum, item) => sum + item.earningCount,
      0,
    );
    const totalEarnings = data.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      data,
      totalEarnings,
      totalTransactions,
    };
  }

  @Get('yoga-distribution')
  async getYogaBookingStats(): Promise<YogaBookingsResponseDto> {
    const data = await this.bookingService.getYogaBookingStats();

    const totalBookings = data.reduce(
      (sum, item) => sum + item.bookingCount,
      0,
    );

    return {
      data,
      totalBookings,
    };
  }

  @Get('dashboard-stats')
  async getDashboardStats(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ): Promise<DashboardStatsDto> {
    // Validate required query parameters
    if (!fromDate || !toDate) {
      throw new BadRequestException(
        'fromDate and toDate query parameters are required',
      );
    }

    return await this.bookingService.getDashboardStats(fromDate, toDate);
  }
}
