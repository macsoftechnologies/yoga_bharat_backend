import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { LanguageService } from './language.service';
import { languageDto } from './dto/language.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/add')
  async addLanguage(@Body() req: languageDto) {
    try{
      const add = await this.languageService.addlanguage(req);
      return add
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @UseGuards(JwtGuard)
  @Get('/list')
  async getLanguages(@Query('page') page = 1, @Query('limit') limit = 10) {
    try{
      const getlist = await this.languageService.getLanguageList(
        Number(page),
        Number(limit),
      );
      return getlist
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @UseGuards(JwtGuard)
  @Post('/languagebyid')
  async getlanguageById(@Body() req: languageDto) {
    try{
      const languagebyid = await this.languageService.getLanguageById(req);
      return languagebyid
    } catch(error){
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/update')
  async updatelanguage(@Body() req: languageDto) {
    try{
      const modify = await this.languageService.updateLanguage(req);
      return modify
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/delete')
  async deletelanguage(@Body() req: languageDto) {
    try{
      const remove = await this.languageService.deleteLanguage(req);
      return remove
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      }
    }
  }
}
