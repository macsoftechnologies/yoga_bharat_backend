import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { ratingDto } from './dto/rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('/add')
  async addrating(@Body() req: ratingDto) {
    try{
      const rating = await this.ratingsService.addRating(req);
      return rating
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }

    @Get('/trainerratings')
    async getTrainerEarning(
      @Query('trainerId') trainerId: string,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
    ) {
      try {
        const add = await this.ratingsService.getRatings(String(trainerId), Number(page), Number(limit));
        return add;
      } catch (error) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error,
        };
      }
    }
}
