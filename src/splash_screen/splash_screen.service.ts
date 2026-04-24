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
  ) { }
  async addSplashScreen(req: splashScreenDto, image) {
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

        req.screen_image = reqDoc.toString();
      }
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

  // async updateSplashScreen(req: splashScreenDto, image) {
  //   try {
  //     if (req.screen_image) {
  //       if (image) {
  //         const reqDoc = image.map((doc, index) => {
  //           let IsPrimary = false;
  //           if (index == 0) {
  //             IsPrimary = true;
  //           }
  //           const randomNumber = Math.floor(Math.random() * 1000000 + 1);
  //           return doc.filename;
  //         });

  //         req.screen_image = reqDoc.toString();
  //       }
  //       const update = await this.splashModel.updateOne(
  //         { splashscreenId: req.splashscreenId },
  //         {
  //           $set: {
  //             text: req.text,
  //             screen_type: req.screen_type,
  //             screen_no: req.screen_no,
  //             screen_image: req.screen_image
  //           },
  //         },
  //       );
  //       if (update) {
  //         return {
  //           statusCode: HttpStatus.OK,
  //           message: 'Splash Screen updated successfully',
  //           data: update,
  //         };
  //       } else {
  //         return {
  //           statusCode: HttpStatus.NOT_FOUND,
  //           message: 'Splash Screen not found',
  //         };
  //       }
  //     } else {
  //       const update = await this.splashModel.updateOne(
  //         { splashscreenId: req.splashscreenId },
  //         {
  //           $set: {
  //             text: req.text,
  //             screen_type: req.screen_type,
  //             screen_no: req.screen_no,
  //           },
  //         },
  //       );
  //       if (update) {
  //         return {
  //           statusCode: HttpStatus.OK,
  //           message: 'Splash Screen updated successfully',
  //           data: update,
  //         };
  //       } else {
  //         return {
  //           statusCode: HttpStatus.NOT_FOUND,
  //           message: 'Splash Screen not found',
  //         };
  //       }
  //     }
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error,
  //     };
  //   }
  // }

  async updateSplashScreen(req: splashScreenDto, image) {
    try {
      // ✅ Check the uploaded files array, not the DTO field
      if (image && image.length > 0) {
        const reqDoc = image.map((doc) => doc.filename);
        req.screen_image = reqDoc.toString();

        const update = await this.splashModel.updateOne(
          { splashscreenId: req.splashscreenId },
          {
            $set: {
              text: req.text,
              screen_type: req.screen_type,
              screen_no: req.screen_no,
              screen_image: req.screen_image, // ✅ Now correctly set
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
      } else {
        // No new image uploaded — update other fields only
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
          message: `SplashScreen of ${req.screen_no} for ${req.screen_type}. `,
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
