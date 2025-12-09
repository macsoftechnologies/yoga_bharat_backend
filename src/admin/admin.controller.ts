import {
  Body,
  Controller,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { adminDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('/adminregister')
  async adminRegister(@Body() req: adminDto) {
    try {
      return await this.adminService.createAdmin(req);
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message || 'Something went wrong',
      };
    }
  }

  @Post('/loginadmin')
  async loginRegister(@Body() req: adminDto) {
    try {
      const loginadmin = await this.adminService.loginAdmin(req);
      return loginadmin;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/adminforgotpassword')
  async adminForgotPassword(@Body() req: adminDto) {
    try {
      const adminpassword = await this.adminService.forgotPassword(req);
      return adminpassword;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
