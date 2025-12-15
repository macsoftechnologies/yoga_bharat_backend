import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';
import { privacyDto } from './tdo/privacy.dto';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/addprivacy')
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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/getprivacy')
  async getPrivacy() {
    try {
      const list = await this.privacyService.getPrivacy();
      return list;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  // @Post('/privacybyid')
  // async privacyByID(@Body('privacyId') id: string) {
  //   try {
  //     const byid = await this.privacyService.privacyById(id);
  //     return byid;
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error,
  //     };
  //   }
  // }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/updateprivacy')
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
  @Post('/deleteprivacy')
  async deletePrivacy(@Body('privacyId') id: string) {
    try {
      const del = await this.privacyService.deletePrivacy(id);
      return del;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
