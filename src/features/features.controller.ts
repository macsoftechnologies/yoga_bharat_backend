import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// import { Controller } from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
// import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';
import { FeaturesService } from './features.service';
import { featuresDto } from './dto/features.dto';

@Controller('feature')
export class FeaturesController {
  constructor(private readonly FeaturesService: FeaturesService) {}
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/addfeatures')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './files',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addFeatures(@Body() req: featuresDto, @UploadedFiles() image) {
    try {
      const add = await this.FeaturesService.addFeatures(req, image);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Get('/features')
  async getFeatureList() {
    try {
      const getlist = await this.FeaturesService.getFeatureList();
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Post('/featurebyid')
  async getFeaturesById(@Body() req: featuresDto) {
    try {
      const getfeatures = await this.FeaturesService.getFeaturesById(req);
      return getfeatures;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard)
  // @Post('/featurebyid')
  // async getFeaturesById(@Body() req: featuresDto) {
  //   try {
  //     const getfeatures = await this.FeaturesService.getFeaturesById(req);
  //     return getfeatures;
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error,
  //     };
  //   }
  // }
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/updatefeatures')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './files',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async editFeatures(@Body() req: featuresDto, @UploadedFiles() image) {
    try {
      const moderateFeature = await this.FeaturesService.updatefeatures(
        req,
        image,
      );
      return moderateFeature;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/deletefeatures')
  async deletefeatues(@Body() req: featuresDto) {
    try {
      const removefeature = await this.FeaturesService.deletefeatues(req);
      return removefeature;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
