import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, ratingSchema } from './schema/rating.schema';
import { Booking, bookingSchema } from 'src/booking/schema/booking.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Rating.name, schema: ratingSchema },
    { name: Booking.name, schema: bookingSchema }
  ])],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule { }
