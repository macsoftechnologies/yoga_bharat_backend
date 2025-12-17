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
import { YogaService } from './yoga.service';
import { yogaDetailsDto } from './dto/yoga_details.dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('yoga')
export class YogaController {
  constructor(private readonly yogaService: YogaService) {}
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/add')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'yoga_image' },
      { name: 'yoga_icon' },
    ]),
  )
  async addYogaDetails(@Body() req: yogaDetailsDto, @UploadedFiles() image) {
    try {
      const addyoga = await this.yogaService.addYoga(req, image);
      return addyoga;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Get('/list')
  async getYogaList() {
    try {
      const getlist = await this.yogaService.getYogaAll();
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Post('/yogabyid')
  async getYogaById(@Body() req: yogaDetailsDto) {
    try {
      const getyoga = await this.yogaService.getYogaById(req);
      return getyoga;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'yoga_image' },
      { name: 'yoga_icon' },
    ]),
  )
  async editYogaDetail(@Body() req: yogaDetailsDto, @UploadedFiles() image) {
    try {
      const moderateYogaDet = await this.yogaService.updateyogadetails(
        req,
        image,
      );
      return moderateYogaDet;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/delete')
  async deleteyoga(@Body() req: yogaDetailsDto) {
    try {
      const removeyoga = await this.yogaService.deleteYoga(req);
      return removeyoga;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
