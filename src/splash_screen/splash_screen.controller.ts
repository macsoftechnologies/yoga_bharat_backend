import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SplashScreenService } from './splash_screen.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { splashScreenDto } from './dto/splash_screen.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('splashscreen')
export class SplashScreenController {
  constructor(private readonly splashScreenService: SplashScreenService) { }

  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Post('/add')
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
  async addSplashScreen(@Body() req: splashScreenDto, @UploadedFiles() image) {
    try {
      const add = await this.splashScreenService.addSplashScreen(req, image);

      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard)
  @Get('/list')
  async getSplashScreenList(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const list = await this.splashScreenService.getSplashScreenList(
        Number(page),
        Number(limit),
      );
      return list;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard)
  @Post('/screentextbyid')
  async getSplashScreenById(@Body() req: splashScreenDto) {
    try {
      const splash = await this.splashScreenService.getSplashScreenById(req);
      return splash;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Post('/update')
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
  async updateSplashScreen(@Body() req: splashScreenDto, @UploadedFiles() image) {
    try {
      const update = await this.splashScreenService.updateSplashScreen(req, image);
      return update;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Post('/delete')
  async deleteSplashScreen(@Body() req: splashScreenDto) {
    try {
      const del = await this.splashScreenService.deleteSplashScreen(req);
      return del;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/screensbytype')
  async splashScreensByType(@Body() req: splashScreenDto) {
    try {
      const list = await this.splashScreenService.getScreensByUserType(req);
      return list;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
