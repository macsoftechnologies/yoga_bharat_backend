import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
// import { RolesGuard } from 'src/auth/guards/roles.guard';
// import { Roles } from 'src/auth/guards/roles.decorator';
// import { Role } from 'src/auth/guards/roles.enum';
import { TermsService } from './terms.service';
import { termsDto } from './tdo/terms.dto';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/addterms')
  async addterms(@Body() req: termsDto) {
    try {
      const add = await this.termsService.addterms(req);
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
  @Get('/getterms')
  async getterms() {
    try {
      const list = await this.termsService.getterms();
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
  @Post('/termsbyid')
  async termsByID(@Body('termsId') id: string) {
    try {
      const byid = await this.termsService.termsByID(id);
      return byid;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  @UseGuards(JwtGuard)
  // @Roles(Role.ADMIN)
  @Post('/updateterms')
  async updateTerms(@Body() req: termsDto) {
    try {
      const update = await this.termsService.updateTerms(req);
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
  @Post('/deleteterms')
  async deleteTerms(@Body('termsId') id: string) {
    try {
      const del = await this.termsService.deleteTerms(id);
      return del;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
