import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Rating } from './schema/rating.schema';
import { Model } from 'mongoose';
import { ratingDto } from './dto/rating.dto';
import { Booking } from 'src/booking/schema/booking.schema';

@Injectable()
export class RatingsService {
    constructor(@InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
        @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,) { }

    async addRating(req: ratingDto) {
        try {
            const findBooking = await this.bookingModel.findOne({ bookingId: req.bookingId });
            if (!findBooking) {
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
            if (addrating) {
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
        } catch (error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            }
        }
    }

    async getRatings(trainerId: string, page: number, limit: number) {
        try {
            console.log('id...', trainerId)
            const skip = (page - 1) * limit;

            const result = await this.ratingModel.aggregate([
                { $match: { trainerId: trainerId } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'clientId',
                        foreignField: 'userId',
                        as: 'clientId',
                    },
                },
                { $unwind: { path: '$clientId', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'yogadetails',
                        localField: 'yogaId',
                        foreignField: 'yogaId',
                        as: 'yogaId',
                    },
                },
                { $unwind: { path: '$yogaId', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'bookings',
                        localField: 'bookingId',
                        foreignField: 'bookingId',
                        as: 'bookingId',
                    },
                },
                { $unwind: { path: '$bookingId', preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        data: [{ $skip: skip }, { $limit: limit }],
                        totalCount: [{ $count: 'count' }],
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    averageRating: { $avg: { $toDouble: '$rating' } },
                                    totalRatings: { $sum: 1 },
                                    totalReviews: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $gt: [
                                                        {
                                                            $strLenCP: {
                                                                $trim: {
                                                                    input: { $ifNull: ['$review', ''] },
                                                                },
                                                            },
                                                        },
                                                        0,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            ]);

            const data = result[0]?.data || [];
            const totalCount = result[0]?.totalCount[0]?.count || 0;
            const summary = result[0]?.summary[0];

            return {
                statusCode: HttpStatus.OK,
                message: 'Ratings of Trainer',
                averageRating: summary?.averageRating
                    ? Math.round(summary.averageRating * 10) / 10
                    : null,
                totalRatings: summary?.totalRatings || 0,
                totalReviews: summary?.totalReviews || 0,
                currentPage: page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                data,
            };
        } catch (error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
            };
        }
    }
}
