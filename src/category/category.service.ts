import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schema/category.schema';
import { Model } from 'mongoose';
import { categoryDto } from './dto/category.dto';
import { YogaDetails } from 'src/yoga/schema/yoga_details.schema';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
        @InjectModel(YogaDetails.name) private readonly yogaModel: Model<YogaDetails>,
    ) { }

    async addCategory(req: categoryDto): Promise<object> {
        try {
            const addCategory = await this.categoryModel.create(req);
            if (addCategory) {
                return {
                    statusCode: HttpStatus.OK,
                    message: 'Category added successfully',
                    data: addCategory,
                };
            } else {
                return {
                    statusCode: HttpStatus.EXPECTATION_FAILED,
                    message: 'Failed to add category',
                };
            }
        } catch (error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error?.message,
            };
        }
    }

    async getCategories(page: number, limit: number): Promise<object> {
        try {
            const skip = (page - 1) * limit;

            const [getList, totalCount] = await Promise.all([
                this.categoryModel.find().skip(skip).limit(limit).lean(),
                this.categoryModel.countDocuments(),
            ]);

            const categoryIds = getList.map((cat) => cat.categoryId);

            const yogaDetails = await this.yogaModel
                .find({ categoryId: { $in: categoryIds } })
                .lean();

            const yogaMap = yogaDetails.reduce((acc, yoga) => {
                const key = yoga.categoryId;
                if (!acc[key]) acc[key] = [];
                acc[key].push(yoga);
                return acc;
            }, {} as Record<string, any[]>);

            const enrichedList = getList.map((cat) => ({
                ...cat,
                subcategories: yogaMap[cat.categoryId] || [],
            }));

            return {
                statusCode: HttpStatus.OK,
                message: 'List of Categories',
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                limit,
                data: enrichedList,
            };
        } catch (error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || error,
            };
        }
    }

    async getCategoryById(categoryId: string): Promise<object> {
        try {
            const category = await this.categoryModel
                .findOne({ categoryId })
                .lean();

            if (!category) {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Category not found',
                };
            }

            const yogaDetails = await this.yogaModel
                .find({ categoryId })
                .lean();

            return {
                statusCode: HttpStatus.OK,
                message: 'Category Details',
                data: {
                    ...category,
                    subcategories: yogaDetails,
                },
            };
        } catch (error) {
            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || error,
            };
        }
    }
}