import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { splashScreenDto } from './dto/splash_screen.dto';
import { SplashScreen } from './schema/splash_screen.schema';

@Injectable()
export class SplashScreenService {
  constructor(
    @InjectModel(SplashScreen.name)
    private readonly splashModel: Model<SplashScreen>,
  ) {}
  async addSplashScreen(req: splashScreenDto) {
    try {
      const add = await this.splashModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Splash Screen added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add Splash Screen',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getSplashScreenList(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.splashModel.find().skip(skip).limit(limit),
        this.splashModel.countDocuments(),
      ]);
      return {
        statusCode: HttpStatus.OK,
        message: 'List of SplashScreens',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getSplashScreenById(req: splashScreenDto) {
    try {
      const splash = await this.splashModel.findOne({
        splashscreenId: req.splashscreenId,
      });
      if (splash) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Splash Screen fetched successfully',
          data: splash,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Splash Screen not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async updateSplashScreen(req: splashScreenDto) {
    try {
      const update = await this.splashModel.updateOne(
        { splashscreenId: req.splashscreenId },
        {
          $set: {
            text: req.text,
            screen_type: req.screen_type,
            screen_no: req.screen_no,
          },
        },
      );
      if (update) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Splash Screen updated successfully',
          data: update,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Splash Screen not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async deleteSplashScreen(req: splashScreenDto) {
    try {
      const del = await this.splashModel.deleteOne({
        splashscreenId: req.splashscreenId,
      });
      if (del) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Splash Screen deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Splash Screen not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getScreensByUserType(req: splashScreenDto) {
    try {
      const findScreens = await this.splashModel.findOne({
        $and: [{ screen_type: req.screen_type }, { screen_no: req.screen_no }],
      });
      if (findScreens) {
        return {
          statusCode: HttpStatus.OK,
          message: `SplashScreen Tesxt of ${req.screen_no} for ${req.screen_type}. `,
          data: findScreens,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "SplashScreen Text not found"
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
