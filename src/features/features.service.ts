import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeatureDetails } from './schema/features.schema';
import { featuresDto } from './dto/features.dto';
// import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectModel(FeatureDetails.name)
    private readonly featureModel: Model<FeatureDetails>,
  ) {}
  async addFeatures(req: featuresDto, image) {
    try {
      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.feature_image = reqDoc.toString();
      }
      const add = await this.featureModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Features Details added successfully.',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add Features Details.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getFeatureList(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.featureModel.find().skip(skip).limit(limit),
        this.featureModel.countDocuments(),
      ]);
      return {
        statusCode: HttpStatus.OK,
        message: 'List of Featured Banners',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
      // const getList = await this.featureModel.find();
      // if (getList.length > 0) {
      //   return {
      //     statusCode: HttpStatus.OK,
      //     message: 'List of Feature Details',
      //     data: getList,
      //   };
      // } else {
      //   return {
      //     statusCode: HttpStatus.NOT_FOUND,
      //     message: 'No Feature Details found.',
      //   };
      // }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getFeaturesById(req: featuresDto) {
    try {
      const getfeatures = await this.featureModel.findOne({
        featureId: req.featureId,
      });
      if (getfeatures) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Requested Yoga Details',
          data: getfeatures,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Yoga Details Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async updatefeatures(req: featuresDto, image) {
    try {
      const findFeatures = await this.featureModel.findOne({
        featureId: req.featureId,
      });

      if (!findFeatures) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Feature not found',
        };
      }

      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.feature_image = reqDoc.toString();
      }

      if (req.feature_image) {
        const updatefeatures = await this.featureModel.updateOne(
          { featureId: req.featureId },
          { $set: { feature_image: req.feature_image, link: req.link } },
        );

        if (updatefeatures.modifiedCount) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Feature updated successfully',
            data: updatefeatures,
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to update feature',
          };
        }
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No update data provided',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async deletefeatues(req: featuresDto) {
    try {
      const deleteFeatures = await this.featureModel.deleteOne({
        featureId: req.featureId,
      });
      if (deleteFeatures.deletedCount === 1) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Features Deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete Features ',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
