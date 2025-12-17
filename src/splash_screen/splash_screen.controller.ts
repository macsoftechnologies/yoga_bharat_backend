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
// import { RolesGuard } from 'src/auth/guards/roles.guard';
// import { Roles } from 'src/auth/guards/roles.decorator';
// import { Role } from 'src/auth/guards/roles.enum';
import { splashScreenDto } from './dto/splash_screen.dto';

@Controller('splashscreen')
export class SplashScreenController {
  constructor(private readonly splashScreenService: SplashScreenService) {}

  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/addsplash')
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
  // @Roles(Role.ADMIN)
  @Get('/getlist')
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
  // @Roles(Role.ADMIN)
  @Post('/getSplashbyid')
  async getSplashScreenById(@Body('splashscreenId') id: string) {
    try {
      const splash = await this.splashScreenService.getSplashScreenById(id);
      return splash;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/updatesplash')
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
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/deletesplash')
  async deleteSplashScreen(@Body('splashscreenId') id: string) {
    try {
      const del = await this.splashScreenService.deleteSplashScreen(id);
      return del;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
