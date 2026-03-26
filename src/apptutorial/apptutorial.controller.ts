import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';
import { ApptutorialService } from './apptutorial.service';
import { apptutorialDto } from './dto/apptutorial.dto';

@Controller('apptutorial')
export class ApptutorialController {
  constructor(private readonly ApptutorialService: ApptutorialService) {}
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/add')
  @UseInterceptors(
    FileInterceptor('app_image', {
      storage: diskStorage({
        destination: './files',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomName}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Only video files are allowed. Received: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    }),
  )
  async addTutorial(@Body() req: apptutorialDto, @UploadedFile() app_image) {
    try {
      const add = await this.ApptutorialService.addTutorial(req, app_image);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
  
  @Get('/list')
  async getAppTutoiral(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const getlist = await this.ApptutorialService.getAppTutoiral(
        Number(page),
        Number(limit),
      );
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Post('/tutorialbyid')
  async getAppbyId(@Body() req: apptutorialDto) {
    try {
      const getapptut = await this.ApptutorialService.getAppbyId(req);
      return getapptut;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  // @Post('/update')
  // @UseInterceptors(
  //   AnyFilesInterceptor({
  //     storage: diskStorage({
  //       destination: './files',
  //       filename: (req, file, cb) => {
  //         const randomName = Array(32)
  //           .fill(null)
  //           .map(() => Math.round(Math.random() * 16).toString(16))
  //           .join('');
  //         cb(null, `${randomName}${extname(file.originalname)}`);
  //       },
  //     }),
  //   }),
  // )
  // async editApp(@Body() req: apptutorialDto, @UploadedFiles() image) {
  //   try {
  //     const moderateApp = await this.ApptutorialService.updateapp(req, image);
  //     return moderateApp;
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error,
  //     };
  //   }
  // }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update')
  @UseInterceptors(
    FileInterceptor('app_image', {
      storage: diskStorage({
        destination: './files',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomName}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Only video files are allowed. Received: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  )
  async editApp(@Body() req: apptutorialDto, @UploadedFile() app_image) {
    try {
      const moderateApp = await this.ApptutorialService.updateapp(req, app_image);
      return moderateApp;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/delete')
  async deletetutorial(@Body() req: apptutorialDto) {
    try {
      const removetutorial = await this.ApptutorialService.deletetutorial(req);
      return removetutorial;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
