import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SplashScreenService } from './splash_screen.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { splashScreenDto } from './dto/splash_screen.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('splashscreen')
export class SplashScreenController {
  constructor(private readonly splashScreenService: SplashScreenService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/add')
  async addSplashScreen(@Body() req: splashScreenDto) {
    try {
      const add = await this.splashScreenService.addSplashScreen(req);

      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Get('/list')
  async getSplashScreenList() {
    try {
      const list = await this.splashScreenService.getSplashScreenList();
      return list;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update')
  async updateSplashScreen(@Body() req: splashScreenDto) {
    try {
      const update = await this.splashScreenService.updateSplashScreen(req);
      return update;
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
}
