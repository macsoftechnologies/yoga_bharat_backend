import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppTutorial } from './schema/apptutorial.schema';
import { apptutorialDto } from './dto/apptutorial.dto';
// import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ApptutorialService {
  constructor(
    @InjectModel(AppTutorial.name)
    private readonly tutorialModel: Model<AppTutorial>,
  ) {}
  async addTutorial(req: apptutorialDto, image) {
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

        req.app_image = reqDoc.toString();
      }
      const add = await this.tutorialModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'App Tutorial Details added successfully.',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add App Tutorial Details.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getAppTutoiral(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.tutorialModel.find().skip(skip).limit(limit),
        this.tutorialModel.countDocuments(),
      ]);
      return {
        statusCode: HttpStatus.OK,
        message: 'List of App Tutorial Details',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
      // const getList = await this.tutorialModel.find();
      // if (getList.length > 0) {
      //   return {
      //     statusCode: HttpStatus.OK,
      //     message: 'List of App Tutorial Details',
      //     data: getList,
      //   };
      // } else {
      //   return {
      //     statusCode: HttpStatus.NOT_FOUND,
      //     message: 'No App Tutorial Details found.',
      //   };
      // }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getAppbyId(req: apptutorialDto) {
    try {
      const getapptut = await this.tutorialModel.findOne({
        appId: req.appId,
      });
      if (getapptut) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Requested App Tutorial Details',
          data: getapptut,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'App Tutorial Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async updateapp(req: apptutorialDto, image) {
    try {
      const findapp = await this.tutorialModel.findOne({
        appId: req.appId,
      });

      if (!findapp) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'App Tutorial not found',
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

        req.app_image = reqDoc.toString();
      }

      if (req.app_image) {
        const updateapp = await this.tutorialModel.updateOne(
          { appId: req.appId },
          { $set: { app_image: req.app_image } },
        );

        if (updateapp.modifiedCount) {
          return {
            statusCode: HttpStatus.OK,
            message: 'App Tutorial updated successfully',
            data: updateapp,
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to update App Tutorial',
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

  async deletetutorial(req: apptutorialDto) {
    try {
      const deleteapps = await this.tutorialModel.deleteOne({
        appId: req.appId,
      });
      if (deleteapps.deletedCount === 1) {
        return {
          statusCode: HttpStatus.OK,
          message: 'App Tutorial Deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete App Tutorial ',
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
