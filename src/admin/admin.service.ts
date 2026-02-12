import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { adminDto } from './dto/admin.dto';
import { Admin } from './schema/admin.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import axios from 'axios';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    private readonly authService: AuthService,
  ) {}

  async createAdmin(req: adminDto) {
    try {
      const findAdmin = await this.adminModel.findOne({
        $or: [{ emailId: req.emailId }, { mobileNumber: req.mobileNumber }],
      });
      if (!findAdmin) {
        const bcryptPassword = await this.authService.hashPassword(
          req.password,
        );
        const createAdmin = await this.adminModel.create({
          mobileNumber: req.mobileNumber,
          emailId: req.emailId,
          password: bcryptPassword,
        });
        if (createAdmin) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Admin Registered Successfully',
            data: createAdmin,
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to create admin',
          };
        }
      }

      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Admin already existed',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async loginAdmin(req: adminDto) {
    try {
      const findAdmin = await this.adminModel.findOne({
        $or: [{ emailId: req.emailId }, { mobileNumber: req.mobileNumber }],
      });
      if (!findAdmin) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Admin Not Found',
        };
      } else {
        const matchPassword = await this.authService.comparePassword(
          req.password,
          findAdmin.password,
        );
        // console.log(matchPassword);
        if (matchPassword) {
          let generatedOtp = Math.floor(1000 + Math.random() * 900000);
          const updateOTP = await this.adminModel.updateOne(
            { adminId: findAdmin.adminId },
            {
              $set: {
                otp: generatedOtp,
              },
            },
          );
          if (updateOTP.modifiedCount <= 0) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Unable to sent OTP',
            };
          }
          const sendOTP = await axios.post(
            `https://restapi.smscountry.com/v0.1/Accounts/${process.env.SMS_AUTH_KEY}/SMSes/`,
            {
              Text: `Your OTP for Yoga Bharath verification is ${generatedOtp}. Do not share this OTP with anyone.`,
              Number: `91${findAdmin.mobileNumber}`,
              SenderId: process.env.SENDER_ID,
            },
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.SMS_AUTH_KEY}:${process.env.PASSWORD}`,
                ).toString('base64')}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (sendOTP) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Credentials Matched. Please Verify OTP',
              data: findAdmin,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'failed to send otp',
            };
          }
        } else {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Password incorrect',
          };
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async verifyOtp(req: adminDto) {
    try {
      const findAdmin = await this.adminModel.findOne({ adminId: req.adminId });
      if (findAdmin) {
        if (req.otp == findAdmin.otp) {
          const jwtToken = await this.authService.createToken({ findAdmin });
          // console.log(jwtToken);
          return {
            statusCode: HttpStatus.OK,
            message: 'Admin Login successfull',
            token: jwtToken,
            data: findAdmin,
          };
        } else {
          return {
            statuCode: HttpStatus.BAD_REQUEST,
            message: "Invalid OTP",
          }
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Admin not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async forgotPassword(req: adminDto) {
    try {
      const findAdmin = await this.adminModel.findOne({
        $or: [{ emailId: req.emailId }, { mobileNumber: req.mobileNumber }],
      });
      if (findAdmin) {
        const bcryptPassword = await this.authService.hashPassword(
          req.password,
        );
        req.password = bcryptPassword;
        const forgotPassword = await this.adminModel.updateOne(
          { emailId: findAdmin.emailId },
          {
            $set: {
              password: req.password,
            },
          },
        );
        if (forgotPassword) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Password Updated Successfully',
            data: forgotPassword,
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Password updation failed',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Admin not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
}
