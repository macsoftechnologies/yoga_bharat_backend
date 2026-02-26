import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { privacyDto } from './tdo/privacy.dto';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/add')
  async addprivacy(@Body() req: privacyDto) {
    try {
      const add = await this.privacyService.addprivacy(req);
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
  @Get('/list')
  async getPrivacy(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const list = await this.privacyService.getPrivacy(
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
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/privacybyid')
  async privacyByID(@Body() req: privacyDto) {
    try {
      const byid = await this.privacyService.privacyById(req);
      return byid;
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
  async updatePrivacy(@Body() req: privacyDto) {
    try {
      const update = await this.privacyService.updatePrivacy(req);
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
  async deletePrivacy(@Body() req: privacyDto) {
    try {
      const del = await this.privacyService.deletePrivacy(req);
      return del;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Get('/learner_privacy_policy')
  async privacyPolicyBylearner() {
    try {
      const byid = await this.privacyService.privacyByClient();
      return byid;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @Get('/trainer_privacy_policy')
  async privacyPolicyBytrainer() {
    try {
      const byid = await this.privacyService.privacyByTrainer();
      return byid;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
