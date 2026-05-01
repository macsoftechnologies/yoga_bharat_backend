import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
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
}
