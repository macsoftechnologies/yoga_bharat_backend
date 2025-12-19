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
import { UsersService } from './users.service';
import { healthPreferenceDto } from './dto/health_preference.dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { professional_detailsDto } from './dto/professional_details.dto';
import { userDto } from './dto/user.dto';
import { clientDto } from './dto/client.dto';
import { trainerEKYCDto } from './dto/trainer_ekyc.dto';
import { trainerDto } from './dto/trainer.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { Role } from 'src/auth/guards/roles.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Starting of Health Preference APIs

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/addhealthpreference')
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
  async addHealthPreference(
    @Body() req: healthPreferenceDto,
    @UploadedFiles() image,
  ) {
    try {
      const addhealth = await this.usersService.addHealth(req, image);
      return addhealth;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard)
  @Get('/healthpreferences')
  async getHealthPrefList() {
    try {
      const getlist = await this.usersService.getHealthPreferences();
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard)
  @Post('/healthpreferencebyid')
  async getHealthPrefById(@Body() req: healthPreferenceDto) {
    try {
      const gethealth = await this.usersService.getHealthById(req);
      return gethealth;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/updatehealthpreference')
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
  async editHealthPreference(
    @Body() req: healthPreferenceDto,
    @UploadedFiles() image,
  ) {
    try {
      const moderateHealthpref = await this.usersService.updateHealthPreference(
        req,
        image,
      );
      return moderateHealthpref;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/deletehealthpreference')
  async deletehealth(@Body() req: healthPreferenceDto) {
    try {
      const removehealth = await this.usersService.deleteHealth(req);
      return removehealth;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  // Ending of Health Preference APIs

  // Starting of Professional Details APIs

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/addprofessionaldetails')
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
  async addProfessionalDetails(
    @Body() req: professional_detailsDto,
    @UploadedFiles() image,
  ) {
    try {
      const addprofession = await this.usersService.addProfession(req, image);
      return addprofession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard)
  @Get('/professionaldetails')
  async getProfessionalDetailsList() {
    try {
      const getlist = await this.usersService.getProfessionalDetails();
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard)
  @Post('/professionaldetailsbyid')
  async getProfessionalDetailsById(@Body() req: professional_detailsDto) {
    try {
      const getprofession = await this.usersService.getProfessionById(req);
      return getprofession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/updateprofessiondetails')
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
  async editProfessionalDetails(
    @Body() req: professional_detailsDto,
    @UploadedFiles() image,
  ) {
    try {
      const moderateprofession =
        await this.usersService.updateProfessionDetails(req, image);
      return moderateprofession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/deleteprofession')
  async deleteprofession(@Body() req: professional_detailsDto) {
    try {
      const removeprofession = await this.usersService.deleteProfession(req);
      return removeprofession;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  // Ending of Professional Details APIs

  // register user through otp
  @Post('/registeruser')
  async registerUser(@Body() req: userDto) {
    try {
      const registerUser = await this.usersService.addUser(req);
      return registerUser;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  // verify OTP
  @Post('/verifyotp')
  async verifyUser(@Body() req: userDto) {
    try {
      const verifyuser = await this.usersService.verifyOTP(req);
      return verifyuser;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/addclient')
  async addClient(@Body() req: clientDto) {
    try {
      const addclient = await this.usersService.createClient(req);
      return addclient;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/addtrainer')
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
  async addTrainer(@Body() req: trainerDto, @UploadedFiles() image) {
    try {
      const addtrainer = await this.usersService.createTrainer(req, image);
      return addtrainer;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @Post('/addtrainerekyc')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificates', maxCount: 10 },
      { name: 'journey_images', maxCount: 10 },
      { name: 'yoga_video', maxCount: 1 },
    ]),
  )
  async addTrainerEKYC(@Body() req: trainerEKYCDto, @UploadedFiles() image) {
    try {
      return await this.usersService.addTrainerEKYC(req, image);
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/clients')
  async getClientsList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const getlist = await this.usersService.getClients(+page, +limit);
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/trainers')
  async getTrainersList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const getlist = await this.usersService.getTrainers(+page, +limit);
      return getlist;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/approvetrainer')
  async aprroveTrainer(@Body() req: trainerEKYCDto) {
    try{
      const accepttrainer = await this.usersService.approveTrainer(req);
      return accepttrainer
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      }
    }
  }

  @UseGuards(JwtGuard)
  @Post('/userbyid')
  async getUser(@Body() req: clientDto) {
    try{
      const userdetails = await this.usersService.getUserById(req);
      return userdetails
    } catch(error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      }
    }
  }
}
