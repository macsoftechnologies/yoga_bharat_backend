import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { AuthService } from 'src/auth/auth.service';
import { YogaDetails } from './schema/yoga_details.schema';
import { yogaDetailsDto } from './dto/yoga_details.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class YogaService {
  constructor(
    @InjectModel(YogaDetails.name)
    private readonly yogaModel: Model<YogaDetails>,
    private readonly authService: AuthService,
  ) {}
  async addYoga(req: yogaDetailsDto, image) {
    try {
      if (image) {
        if (image.yoga_image && image.yoga_image[0]) {
          const attachmentFile = await this.authService.saveFile(
            image.yoga_image[0],
          );
          req.yoga_image = attachmentFile;
        }
        if (image.yoga_icon && image.yoga_icon[0]) {
          const attachmentFile = await this.authService.saveFile(
            image.yoga_icon[0],
          );

          req.yoga_icon = attachmentFile;
        }
      }
      const add = await this.yogaModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Yoga Details added successfully.',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add Yoga Details.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getYogaAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.yogaModel.find().skip(skip).limit(limit),
        this.yogaModel.countDocuments(),
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'List of Yoga Details',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || error,
      };
    }
  }
  async getYogaById(req: yogaDetailsDto) {
    try {
      const getyoga = await this.yogaModel.findOne({ yogaId: req.yogaId });
      if (getyoga) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Requested Yoga Details',
          data: getyoga,
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
  async updateyogadetails(req: yogaDetailsDto, image) {
    try {
      const findYoga = await this.yogaModel.findOne({ yogaId: req.yogaId });
      if (findYoga) {
        if (image) {
          if (image.yoga_image && image.yoga_image[0]) {
            const attachmentFile = await this.authService.saveFile(
              image.yoga_image[0],
            );
            req.yoga_image = attachmentFile;
          }
          if (image.yoga_icon && image.yoga_icon[0]) {
            const attachmentFile = await this.authService.saveFile(
              image.yoga_icon[0],
            );

            req.yoga_icon = attachmentFile;
          }
        }
        if (req.yoga_image) {
          const updateyoga = await this.yogaModel.updateOne(
            { yogaId: req.yogaId },
            {
              $set: {
                yoga_name: req.yoga_name,
                yoga_image: req.yoga_image,
                yoga_desc: req.yoga_desc,
                client_price: req.client_price,
                trainer_price: req.trainer_price,
                duration: req.duration,
              },
            },
          );
          if (updateyoga) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Health Preference updated successfully',
              data: updateyoga,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update health preference',
            };
          }
        }
        if (req.yoga_icon) {
          const updateyoga = await this.yogaModel.updateOne(
            { yogaId: req.yogaId },
            {
              $set: {
                yoga_name: req.yoga_name,
                yoga_icon: req.yoga_icon,
                yoga_desc: req.yoga_desc,
                client_price: req.client_price,
                trainer_price: req.trainer_price,
                duration: req.duration,
              },
            },
          );
          if (updateyoga) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Health Preference updated successfully',
              data: updateyoga,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update health preference',
            };
          }
        }
        if (req.yoga_icon && req.yoga_name) {
          const updateyoga = await this.yogaModel.updateOne(
            { yogaId: req.yogaId },
            {
              $set: {
                yoga_name: req.yoga_name,
                yoga_icon: req.yoga_icon,
                yoga_image: req.yoga_image,
                yoga_desc: req.yoga_desc,
                client_price: req.client_price,
                trainer_price: req.trainer_price,
                duration: req.duration,
              },
            },
          );
          if (updateyoga) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Health Preference updated successfully',
              data: updateyoga,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update health preference',
            };
          }
        }

        const updateyoga = await this.yogaModel.updateOne(
          { yogaId: req.yogaId },
          {
            $set: {
              yoga_name: req.yoga_name,
              yoga_desc: req.yoga_desc,
              client_price: req.client_price,
              trainer_price: req.trainer_price,
              duration: req.duration,
            },
          },
        );
        if (updateyoga) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Yoga Detail updated successfully',
            data: updateyoga,
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to update Yoga Details',
          };
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async deleteYoga(req: yogaDetailsDto) {
    try {
      const deleteYoga = await this.yogaModel.deleteOne({
        yogaId: req.yogaId,
      });
      if (deleteYoga.deletedCount === 1) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Yoga Deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete Yoga ',
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
