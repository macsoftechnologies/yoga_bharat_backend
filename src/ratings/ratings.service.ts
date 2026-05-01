import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Rating } from './schema/rating.schema';
import { Model } from 'mongoose';
import { ratingDto } from './dto/rating.dto';
import { Booking } from 'src/booking/schema/booking.schema';

@Injectable()
export class RatingsService {
    constructor(@InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
@InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,) {}

    async addRating(req: ratingDto) {
        try{
            const findBooking = await this.bookingModel.findOne({bookingId: req.bookingId});
            if(!findBooking) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: "Booking not found",
                }
            }
            const addrating = await this.ratingModel.create({
                ...req,
                bookingId: req.bookingId,
                trainerId: findBooking?.accepted_trainerId,
                clientId: findBooking?.clientId,
                rating: req.rating,
                review: req.review,
                yogaId: findBooking?.yogaId
            });
            if(addrating) {
                return {
                    statusCode: HttpStatus.OK,
                    message: "rating added successfully"
                }
            } else {
                return {
                    statusCode: HttpStatus.EXPECTATION_FAILED,
                    message: 'failed to add rating'
                }
            }
        } catch(error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }
}
