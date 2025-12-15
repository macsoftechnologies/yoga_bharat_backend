import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { AuthService } from 'src/auth/auth.service';
import { YogaDetails } from './schema/yoga_details.schema';
import { yogaDetailsDto } from './dto/yoga_details.dto';

@Injectable()
export class YogaService {
  constructor(
    @InjectModel(YogaDetails.name)
    private readonly yogaModel: Model<YogaDetails>,
  ) {}
  async addYoga(req: yogaDetailsDto, image) {
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

        req.yoga_image = reqDoc.toString();
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
  async getYogaAll() {
    try {
      const getList = await this.yogaModel.find();
      if (getList.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'List of Yoga Details',
          data: getList,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No Yoga Details found.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
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
          const reqDoc = image.map((doc, index) => {
            let IsPrimary = false;
            if (index == 0) {
              IsPrimary = true;
            }
            const randomNumber = Math.floor(Math.random() * 1000000 + 1);
            return doc.filename;
          });

          req.yoga_image = reqDoc.toString();
        }
        if (req.yoga_image) {
          const updateyoga = await this.yogaModel.updateOne(
            { yogaId: req.yogaId },
            {
              $set: {
                yoga_name: req.yoga_name,
                yoga_image: req.yoga_image,
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
        } else {
          const updateyoga = await this.yogaModel.updateOne(
            { yogaId: req.yogaId },
            {
              $set: {
                yoga_name: req.yoga_name,
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
