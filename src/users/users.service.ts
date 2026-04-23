import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { healthPreferenceDto } from './dto/health_preference.dto';
import { HealthPreference } from './schema/health_preference.schema';
import { ProfessionalDetails } from './schema/professional_details.schema';
import { professional_detailsDto } from './dto/professional_details.dto';
import { userDto } from './dto/user.dto';
import { clientDto } from './dto/client.dto';
import { EKYCstatus, Role } from 'src/auth/guards/roles.enum';
import { trainerDto } from './dto/trainer.dto';
import { trainerEKYCDto } from './dto/trainer_ekyc.dto';
import { AuthService } from 'src/auth/auth.service';
import { userEditDto } from './dto/user-edit.dto';
import { certificateDto } from './dto/certificates.dto';
import { Certificate } from './schema/cerificates.schema';
import * as fs from 'fs';
import * as path from 'path';
import { InAppNotificationsService } from 'src/in-app-notifications/in-app-notifications.service';
import { InAppNotifications } from 'src/in-app-notifications/schema/inapp.schema';
import { userDeleteDto } from './dto/delete.dto';
import { trainerAvailabilityDto } from './dto/trainer_availability.dto';
import { TrainerEvents } from './schema/trainer_availability.schema';
import { SMSService } from 'src/auth/sms.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(HealthPreference.name)
    private readonly healthModel: Model<HealthPreference>,
    @InjectModel(ProfessionalDetails.name)
    private readonly profDetailsModel: Model<ProfessionalDetails>,
    private readonly authService: AuthService,
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<Certificate>,
    private readonly inappNotificationService: InAppNotificationsService,
    @InjectModel(InAppNotifications.name)
    private readonly inAppNotificationModel: Model<InAppNotifications>,
    @InjectModel(TrainerEvents.name)
    private readonly trainerEventsModel: Model<TrainerEvents>,
    private readonly smsService: SMSService,
  ) { }

  //  Starting of Health Preferences Apis

  async addHealth(req: healthPreferenceDto, image) {
    try {
      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.preference_icon = reqDoc.toString();
      }
      const add = await this.healthModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Health Preference added successfully.',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add Health Preference.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getHealthPreferences(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.healthModel.find().skip(skip).limit(limit),
        this.healthModel.countDocuments(),
      ]);
      return {
        statusCode: HttpStatus.OK,
        message: 'List of Health Preferences',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
      // const getList = await this.healthModel.find();
      // if (getList.length > 0) {
      //   return {
      //     statusCode: HttpStatus.OK,
      //     message: 'List of Health Preferences',
      //     data: getList,
      //   };
      // } else {
      //   return {
      //     statusCode: HttpStatus.NOT_FOUND,
      //     message: 'No Health Preferences found.',
      //   };
      // }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getHealthById(req: healthPreferenceDto) {
    try {
      const getHealth = await this.healthModel.findOne({ prefId: req.prefId });
      if (getHealth) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Requested Health Preference Details',
          data: getHealth,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Health Preference Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async updateHealthPreference(req: healthPreferenceDto, image) {
    try {
      const findHealth = await this.healthModel.findOne({ prefId: req.prefId });
      if (findHealth) {
        if (image) {
          const reqDoc = image.map((doc, index) => {
            let IsPrimary = false;
            if (index == 0) {
              IsPrimary = true;
            }
            const randomNumber = Math.floor(Math.random() * 1000000 + 1);
            return doc.filename;
          });

          req.preference_icon = reqDoc.toString();
        }
        if (req.preference_icon) {
          const updatepref = await this.healthModel.updateOne(
            { prefId: req.prefId },
            {
              $set: {
                preference_name: req.preference_name,
                preference_icon: req.preference_icon,
              },
            },
          );
          if (updatepref) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Health Preference updated successfully',
              data: updatepref,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update health preference',
            };
          }
        } else {
          const updatepref = await this.healthModel.updateOne(
            { prefId: req.prefId },
            {
              $set: {
                preference_name: req.preference_name,
              },
            },
          );
          if (updatepref) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Health Preference updated successfully',
              data: updatepref,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update Health Preference',
            };
          }
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async deleteHealth(req: healthPreferenceDto) {
    try {
      const deleteHealth = await this.healthModel.deleteOne({
        prefId: req.prefId,
      });
      if (deleteHealth) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Health Preference Deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete Health Preference',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  //   Ending of Health Preference Apis

  //  Starting of Profession Details Apis

  async addProfession(req: professional_detailsDto, image) {
    try {
      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.profession_icon = reqDoc.toString();
      }
      const add = await this.profDetailsModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Profession added successfully.',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add Profession.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getProfessionalDetails() {
    try {
      const getList = await this.profDetailsModel.find();
      if (getList.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'List of Professions',
          data: getList,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No Professions found.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getProfessionById(req: professional_detailsDto) {
    try {
      const getProfession = await this.profDetailsModel.findOne({
        profId: req.profId,
      });
      if (getProfession) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Requested Profession Details',
          data: getProfession,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Profession Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async updateProfessionDetails(req: professional_detailsDto, image) {
    try {
      const findProfession = await this.profDetailsModel.findOne({
        profId: req.profId,
      });
      if (findProfession) {
        if (image) {
          const reqDoc = image.map((doc, index) => {
            let IsPrimary = false;
            if (index == 0) {
              IsPrimary = true;
            }
            const randomNumber = Math.floor(Math.random() * 1000000 + 1);
            return doc.filename;
          });

          req.profession_icon = reqDoc.toString();
        }
        if (req.profession_icon) {
          const updateprof = await this.profDetailsModel.updateOne(
            { profId: req.profId },
            {
              $set: {
                profession_name: req.profession_name,
                profession_icon: req.profession_icon,
              },
            },
          );
          if (updateprof) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Profession updated successfully',
              data: updateprof,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update profession',
            };
          }
        } else {
          const updateprof = await this.profDetailsModel.updateOne(
            { profId: req.profId },
            {
              $set: {
                profession_name: req.profession_name,
              },
            },
          );
          if (updateprof) {
            return {
              statusCode: HttpStatus.OK,
              message: 'Profession updated successfully',
              data: updateprof,
            };
          } else {
            return {
              statusCode: HttpStatus.EXPECTATION_FAILED,
              message: 'Failed to update profession',
            };
          }
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async deleteProfession(req: professional_detailsDto) {
    try {
      const deleteprofession = await this.profDetailsModel.deleteOne({
        profId: req.profId,
      });
      if (deleteprofession) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Profession Deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete Profession',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  //   Ending of Profession Details Apis

  // register user through otp
  async registerUser(req: userDto) {
    try {
      const findUser = await this.userModel.findOne({
        mobileNumber: req.mobileNumber,
      });
      if(findUser?.status == 'inactive') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "User has been deactivated. Please contact Admin."
        }
      }
      if (findUser) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "User Exisited. Please Login."
        }
      }
      const add = await this.userModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: `User registered through mobile number ${req.mobileNumber}`,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: "Failed to register User",
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async addUser(req: userDto) {
    try {
      const findUser = await this.userModel.findOne({
        mobileNumber: req.mobileNumber,
      });
      if(findUser?.status == "inactive") {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "User has been deactivated. Please contact admin."
        }
      }
      if (findUser && (findUser.role == 'trainer' || 'client')) {
        await this.sendOtp(req);
        return {
          statusCode: HttpStatus.NOT_ACCEPTABLE,
          message: 'User already registered please login.',
        };
      } else if (findUser && !findUser.role) {
        await this.sendOtp(req);
        return {
          statusCode: HttpStatus.CONFLICT,
          message:
            'Already Registered but verify otp and provide Details of your profile.',
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "User not found",
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async sendOtp(req: userDto) {
    try {
      const findUser = await this.userModel.findOne({
        mobileNumber: req.mobileNumber,
      });
      console.log('....user details', findUser);
      if (findUser) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);

        const updateOTP = await this.userModel.updateOne(
          { userId: findUser.userId },
          { $set: { otp: generatedOtp } },
        );

        if (updateOTP.modifiedCount <= 0) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Unable to send OTP',
          };
        }

        const otpSent = await this.smsService.sendOtp(
          findUser.mobileNumber,
          generatedOtp,
        );

        if (otpSent) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Sent OTP Successfully',
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to send OTP',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //   verify otp
  async verifyOTP(req: userDto) {
    try {
      const findUser = await this.userModel.findOne({
        mobileNumber: req.mobileNumber,
      });
      if (findUser && !findUser.role && req.otp == findUser?.otp) {
        return {
          statusCode: HttpStatus.OK,
          message: 'User Verified Successfully',
          data: findUser,
        };
      } else if (
        findUser &&
        (findUser.role == 'trainer' || 'client') &&
        req.otp == findUser?.otp
      ) {
        const jwtToken = await this.authService.createToken({ findUser });
        //   console.log(jwtToken);
        return {
          statusCode: HttpStatus.OK,
          message: 'User Login successfull',
          token: jwtToken,
          data: findUser,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to verify user',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async createClient(req: clientDto) {
    try {
      const addclient = await this.userModel.updateOne(
        { userId: req.userId },
        {
          $set: {
            name: req.name,
            email: req.email,
            gender: req.gender,
            age: req.age,
            health_preference: req.health_preference,
            role: Role.CLIENT,
          },
        },
      );
      if (addclient) {
        const findUser = await this.userModel.findOne({ userId: req.userId });
        const jwtToken = await this.authService.createToken({ findUser });
        //   console.log(jwtToken);
        const sendNotification =
          await this.inappNotificationService.addInAppBookingNotification({
            ...req,
            userId: req.userId,
            message: 'Yay! Your details added successfully as client.',
            type: 'add_trainer',
          });
        if (sendNotification) {
          await this.inAppNotificationModel.updateOne(
            {
              inapp_notification_id:
                sendNotification.data?.inapp_notification_id,
            },
            {
              $set: {
                status: 'success',
              },
            },
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'User Login successfull',
          token: jwtToken,
          data: findUser,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to register client',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async createTrainer(req: trainerDto, image) {
    try {
      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.profile_pic = reqDoc.toString();
      }
      const add = await this.userModel.updateOne(
        { userId: req.userId },
        {
          $set: {
            name: req.name,
            email: req.email,
            gender: req.gender,
            age: req.age,
            professional_details: req.professional_details,
            profile_pic: req.profile_pic,
            role: Role.TRAINER,
            istrainerOn: true
          },
        },
      );
      if (add) {
        const findUser = await this.userModel.findOne({ userId: req.userId });
        const jwtToken = await this.authService.createToken({ findUser });
        //   console.log(jwtToken);
        const sendNotification =
          await this.inappNotificationService.addInAppBookingNotification({
            ...req,
            userId: req.userId,
            message: 'Yay! Your details added successfully as trainer.',
            type: 'add_trainer',
          });
        if (sendNotification) {
          await this.inAppNotificationModel.updateOne(
            {
              inapp_notification_id:
                sendNotification.data?.inapp_notification_id,
            },
            {
              $set: {
                status: 'success',
              },
            },
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'User Login successfull',
          token: jwtToken,
          data: findUser,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to register Trainer.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async addTrainerEKYC(req: trainerEKYCDto, image) {
    try {
      // initialize arrays
      const journeyFiles: string[] = [];

      if (image) {
        // ---------- JOURNEY IMAGES ----------
        if (image.journey_images && image.journey_images.length > 0) {
          for (const file of image.journey_images) {
            const savedFile = await this.authService.saveFile(file);
            journeyFiles.push(savedFile);
          }
          req.journey_images = journeyFiles;
        }

        // ---------- SINGLE VIDEO ----------
        if (image.yoga_video && image.yoga_video[0]) {
          req.yoga_video = await this.authService.saveFile(image.yoga_video[0]);
        }
      } else {
        req.journey_images = [];
        req.yoga_video = '';
      }

      const update = await this.userModel.updateOne(
        { userId: req.userId },
        {
          $set: {
            journey_images: req.journey_images,
            yoga_video: req.yoga_video,
            ekyc_status: EKYCstatus.PENDING,
            reject_reason: "",
            reject_type: ""
          },
        },
      );

      if (update.modifiedCount > 0) {
        const user = await this.userModel.findOne({ userId: req.userId });
        const sendNotification =
          await this.inappNotificationService.addInAppBookingNotification({
            ...req,
            userId: req.userId,
            message: 'Your EKYC Added.',
            type: 'add_ekyc',
          });
        if (sendNotification) {
          await this.inAppNotificationModel.updateOne(
            {
              inapp_notification_id:
                sendNotification.data?.inapp_notification_id,
            },
            {
              $set: {
                status: 'success',
              },
            },
          );
        }
        return {
          statusCode: HttpStatus.OK,
          message: 'EKYC added successfully',
          data: user,
        };
      }

      return {
        statusCode: HttpStatus.EXPECTATION_FAILED,
        message: 'Failed to add EKYC Details',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async addTrainerBankDetails(req: trainerEKYCDto) {
    try {
      const addBank = await this.userModel.updateOne(
        { userId: req.userId },
        {
          $set: {
            recipient_name: req.recipient_name,
            account_no: req.account_no,
            ifsc_code: req.ifsc_code,
            account_branch: req.account_branch,
            branch_address: req.branch_address,
            ekyc_status: EKYCstatus.PENDING,
            reject_reason: "",
            reject_type: ""
          },
        },
      );
      if (addBank.modifiedCount > 0) {
        const user = await this.userModel.findOne({ userId: req.userId });
        return {
          statusCode: HttpStatus.OK,
          message: 'Bank details added successfully',
          data: user,
        };
      }

      return {
        statusCode: HttpStatus.EXPECTATION_FAILED,
        message: 'Failed to add Bank Details',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async trainerOnOff(req: trainerDto) {
    try {
      const findUser = await this.userModel.findOne({ userId: req.userId });
      if (!findUser) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Trainer not found",
        }
      }
      const trainer_off = await this.userModel.updateOne({ userId: req.userId }, {
        $set: {
          istrainerOn: req.istrainerOn
        }
      });
      if (trainer_off.modifiedCount > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: "Trainer availability captured"
        }
      } else {
        return {
          statusCodE: HttpStatus.EXPECTATION_FAILED,
          message: "failed to update trainer availability"
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }

  // async getClients(page: number, limit: number) {
  //   try {
  //     const skip = (page - 1) * limit;

  //     // --- 1. Total count ---
  //     const totalCount = await this.userModel
  //       .find({ role: Role.CLIENT })
  //       .countDocuments();

  //     // --- 2. Paginated aggregation ---
  //     const getusers = await this.userModel.aggregate([
  //       { $match: { role: Role.CLIENT } },
  //       {
  //         $lookup: {
  //           from: 'healthpreferences',
  //           localField: 'health_preference',
  //           foreignField: 'prefId',
  //           as: 'health_preference',
  //         },
  //       },
  //       // {
  //       //   $addFields: {
  //       //     certificates: {
  //       //       $cond: {
  //       //         if: { $gt: [{ $size: '$certificates' }, 0] },
  //       //         then: '$certificates',
  //       //         else: '$$REMOVE',
  //       //       },
  //       //     },
  //       //     journey_images: {
  //       //       $cond: {
  //       //         if: { $gt: [{ $size: '$journey_images' }, 0] },
  //       //         then: '$journey_images',
  //       //         else: '$$REMOVE',
  //       //       },
  //       //     },
  //       //   },
  //       // },
  //       { $skip: skip },
  //       { $limit: limit },
  //     ]);

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'List of Clients',
  //       currentPage: page,
  //       limit,
  //       totalCount,
  //       totalPages: Math.ceil(totalCount / limit),
  //       data: getusers,
  //     };
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message || error,
  //     };
  //   }
  // }

  async getClients(page: number, limit: number, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;

      const pipeline: any[] = [];

      const match: any = { role: Role.CLIENT };

      if (filters.gender) {
        match.gender = { $regex: new RegExp(filters.gender, 'i') };
      }

      if (filters.fromDate || filters.toDate) {
        match.createdAt = {};
        if (filters.fromDate) {
          match.createdAt.$gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 999);
          match.createdAt.$lte = toDate;
        }
      }

      pipeline.push({ $match: match });

      pipeline.push(
        {
          $addFields: {
            health_preference_arr: {
              $filter: {
                input: {
                  $map: {
                    input: {
                      $split: [{ $ifNull: ['$health_preference', ''] }, ','],
                    },
                    as: 'item',
                    in: { $trim: { input: '$$item' } }, // ✅ VERY IMPORTANT
                  },
                },
                as: 'item',
                cond: { $ne: ['$$item', ''] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'healthpreferences',
            let: { prefIds: '$health_preference_arr' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$prefId', '$$prefIds'], // ✅ UUID match
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  prefId: 1,
                  preference_name: 1,
                  preference_icon: 1,
                },
              },
            ],
            as: 'health_preference',
          },
        },
        {
          $addFields: {
            health_preference: {
              $cond: {
                if: { $gt: [{ $size: '$health_preference' }, 0] },
                then: '$health_preference',
                else: [],
              },
            },
          },
        }
      );

      const searchMatch: any = {};

      if (filters.name) {
        searchMatch.name = { $regex: new RegExp(filters.name, 'i') };
      }

      if (filters.mobileNumber) {
        searchMatch.mobileNumber = {
          $regex: new RegExp(filters.mobileNumber, 'i'),
        };
      }

      if (Object.keys(searchMatch).length > 0) {
        pipeline.push({ $match: searchMatch });
      }

      const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { createdAt: sortDirection, _id: sortDirection } });

      if (filters.isExport === 'true' || filters.isExport === true) {
        const data = await this.userModel.aggregate(pipeline);
        return {
          statusCode: HttpStatus.OK,
          message: 'Export data fetched successfully',
          totalCount: data.length,
          data,
        };
      }

      pipeline.push({
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      });

      const result = await this.userModel.aggregate(pipeline);

      const getusers = result[0].data;
      const totalCount = result[0].totalCount[0]?.count || 0;

      return {
        statusCode: HttpStatus.OK,
        message: 'List of Clients',
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        data: getusers,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || error,
      };
    }
  }

  // async getTrainers(page: number, limit: number) {
  //   try {
  //     const skip = (page - 1) * limit;

  //     // --- 1. Total count ---
  //     const totalCount = await this.userModel
  //       .find({ role: Role.TRAINER })
  //       .countDocuments();

  //     // --- 2. Paginated aggregation ---
  //     const getusers = await this.userModel.aggregate([
  //       { $match: { role: Role.TRAINER } },
  //       {
  //         $lookup: {
  //           from: 'yogadetails',
  //           localField: 'professional_details',
  //           foreignField: 'yogaId',
  //           as: 'professional_details',
  //         },
  //       },
  //       { $skip: skip },
  //       { $limit: limit },
  //     ]);

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'List of Trainers',
  //       currentPage: page,
  //       limit,
  //       totalCount,
  //       totalPages: Math.ceil(totalCount / limit),
  //       data: getusers,
  //     };
  //   } catch (error) {
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: error.message || error,
  //     };
  //   }
  // }

  async getTrainers(page: number, limit: number, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;

      const pipeline: any[] = [];

      // --- 1. Base match: only trainers ---
      const match: any = { role: Role.TRAINER };

      if (filters.gender) {
        match.gender = { $regex: new RegExp(filters.gender, 'i') };
      }

      // --- 2. Filter by date range on createdAt ---
      if (filters.fromDate || filters.toDate) {
        match.createdAt = {};
        if (filters.fromDate) {
          match.createdAt.$gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 999);
          match.createdAt.$lte = toDate;
        }
      }

      pipeline.push({ $match: match });


      pipeline.push(
        {
          $addFields: {
            professional_details_arr: {
              $filter: {
                input: {
                  $map: {
                    input: {
                      $split: [{ $ifNull: ['$professional_details', ''] }, ','],
                    },
                    as: 'item',
                    in: { $trim: { input: '$$item' } }, // ✅ Add $trim
                  },
                },
                as: 'item',
                cond: { $ne: ['$$item', ''] },
              },
            },
          },
        },
        // {
        //   $lookup: {
        //     from: 'yogadetails',
        //     localField: 'professional_details',
        //     foreignField: 'yogaId',
        //     as: 'professional_details',
        //   },
        // }
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'professional_details_arr',
            foreignField: 'yogaId',
            as: 'professional_details',
          },
        },
        {
          $addFields: {
            professional_details: {
              $cond: {
                if: { $gt: [{ $size: '$professional_details' }, 0] },
                then: '$professional_details',
                else: '$$REMOVE',
              },
            },
          },
        }
      );

      // --- 4. Filter by name or mobileNumber ---
      const searchMatch: any = {};

      if (filters.name) {
        searchMatch.name = { $regex: new RegExp(filters.name, 'i') };
      }

      if (filters.mobileNumber) {
        searchMatch.mobileNumber = {
          $regex: new RegExp(filters.mobileNumber, 'i'),
        };
      }

      if (Object.keys(searchMatch).length > 0) {
        pipeline.push({ $match: searchMatch });
      }

      // --- 5. Sort ---
      const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;
      pipeline.push({ $sort: { createdAt: sortDirection, _id: sortDirection } });

      // --- 6. If isExport, return all filtered data without pagination ---
      if (filters.isExport === 'true' || filters.isExport === true) {
        const data = await this.userModel.aggregate(pipeline);
        return {
          statusCode: HttpStatus.OK,
          message: 'Export data fetched successfully',
          totalCount: data.length,
          data,
        };
      }

      // --- 7. Paginated response using $facet ---
      pipeline.push({
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      });

      const result = await this.userModel.aggregate(pipeline);

      const getusers = result[0].data;
      const totalCount = result[0].totalCount[0]?.count || 0;

      return {
        statusCode: HttpStatus.OK,
        message: 'List of Trainers',
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        data: getusers,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || error,
      };
    }
  }

  async approveTrainer(req: trainerEKYCDto) {
    try {
      const findTrainer = await this.userModel.findOne({ userId: req.userId });
      if (findTrainer) {
        const approvetrainer = await this.userModel.updateOne(
          { userId: req.userId },
          {
            $set: {
              ekyc_status: req.ekyc_status,
              reject_reason: req.reject_reason,
              reject_type: req.reject_type
            },
          },
        );
        if (approvetrainer) {
          const sendNotification =
            await this.inappNotificationService.addInAppBookingNotification({
              ...req,
              userId: req.userId,
              message: 'Yay! Your ekyc has approved.',
              type: 'add_trainer',
            });
          if (sendNotification) {
            await this.inAppNotificationModel.updateOne(
              {
                inapp_notification_id:
                  sendNotification.data?.inapp_notification_id,
              },
              {
                $set: {
                  status: 'success',
                },
              },
            );
          }
          return {
            statusCode: HttpStatus.OK,
            message: 'Trainer EKYC Approved Successfully',
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to Approve Trainer EKYC',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Trainer Not Found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async disableTrainer(req: trainerDto) {
    try {
      const findTrainer = await this.userModel.findOne({ userId: req.userId });
      if (findTrainer) {
        const disableTrainer = await this.userModel.updateOne({ userId: findTrainer.userId }, {
          $set: {
            isDisabled: req.isDisabled
          }
        });
        if (disableTrainer) {
          return {
            statusCode: HttpStatus.OK,
            message: "Trainer Disabled Sucessfully",
          }
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: "Failed to update",
          }
        }
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      }
    }
  }

  async getUserById(req: clientDto) {
    try {
      const findUser = await this.userModel.aggregate([
        {
          $match: { userId: req.userId },
        },
        {
          $addFields: {
            health_preference_arr: {
              $filter: {
                input: {
                  $map: {
                    input: {
                      $split: [{ $ifNull: ['$health_preference', ''] }, ','],
                    },
                    as: 'item',
                    in: { $trim: { input: '$$item' } }, // ✅ VERY IMPORTANT
                  },
                },
                as: 'item',
                cond: { $ne: ['$$item', ''] },
              },
            },
            professional_details_arr: {
              $filter: {
                input: {
                  $map: {
                    input: {
                      $split: [{ $ifNull: ['$professional_details', ''] }, ','],
                    },
                    as: 'item',
                    in: { $trim: { input: '$$item' } }, // ✅ Add $trim
                  },
                },
                as: 'item',
                cond: { $ne: ['$$item', ''] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'healthpreferences',
            localField: 'health_preference_arr',
            foreignField: 'prefId',
            as: 'health_preference',
          },
        },
        {
          $lookup: {
            from: 'yogadetails',
            localField: 'professional_details_arr',
            foreignField: 'yogaId',
            as: 'professional_details',
          },
        },
        {
          $addFields: {
            health_preference: {
              $cond: {
                if: { $gt: [{ $size: '$health_preference' }, 0] },
                then: '$health_preference',
                else: '$$REMOVE',
              },
            },
            professional_details: {
              $cond: {
                if: { $gt: [{ $size: '$professional_details' }, 0] },
                then: '$professional_details',
                else: '$$REMOVE',
              },
            },
            certificates: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$certificates', []] } }, 0] },
                then: '$certificates',
                else: '$$REMOVE',
              },
            },
            journey_images: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$journey_images', []] } }, 0] },
                then: '$journey_images',
                else: '$$REMOVE',
              },
            },
          },
        },
      ]);

      if (findUser && findUser.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'User Details',
          data: findUser[0],
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || error,
      };
    }
  }

  async editUser(req: userEditDto, image) {
    try {
      const findUser = await this.userModel.findOne({ userId: req.userId });
      if (findUser && findUser.role === 'client') {
        if (image) {
          const reqDoc = image.map((doc, index) => {
            let IsPrimary = false;
            if (index == 0) {
              IsPrimary = true;
            }
            const randomNumber = Math.floor(Math.random() * 1000000 + 1);
            return doc.filename;
          });

          req.profile_pic = reqDoc.toString();
        }
        const edit = await this.userModel.updateOne(
          { userId: req.userId },
          {
            $set: {
              name: req.name,
              email: req.email,
              gender: req.gender,
              age: req.age,
              health_preference: req.health_preference,
              profile_pic: req.profile_pic,
            },
          },
        );
        if (edit) {
          const sendNotification =
            await this.inappNotificationService.addInAppBookingNotification({
              ...req,
              userId: req.userId,
              message: 'Your details updated successfully.',
              type: 'update',
            });
          if (sendNotification) {
            await this.inAppNotificationModel.updateOne(
              {
                inapp_notification_id:
                  sendNotification.data?.inapp_notification_id,
              },
              {
                $set: {
                  status: 'success',
                },
              },
            );
          }
          return {
            statusCode: HttpStatus.OK,
            message: 'User Details Updated successfull',
            data: edit,
          };
        } else {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Failed to Update User.',
          };
        }
      } else if (findUser && findUser.role === 'trainer') {
        if (image) {
          const reqDoc = image.map((doc, index) => {
            let IsPrimary = false;
            if (index == 0) {
              IsPrimary = true;
            }
            const randomNumber = Math.floor(Math.random() * 1000000 + 1);
            return doc.filename;
          });

          req.profile_pic = reqDoc.toString();
        }
        const edit = await this.userModel.updateOne(
          { userId: req.userId },
          {
            $set: {
              name: req.name,
              email: req.email,
              gender: req.gender,
              age: req.age,
              professional_details: req.professional_details,
              profile_pic: req.profile_pic,
            },
          },
        );
        if (edit) {
          const sendNotification =
            await this.inappNotificationService.addInAppBookingNotification({
              ...req,
              userId: req.userId,
              message: 'Your details updated successfully.',
              type: 'update',
            });
          if (sendNotification) {
            await this.inAppNotificationModel.updateOne(
              {
                inapp_notification_id:
                  sendNotification.data?.inapp_notification_id,
              },
              {
                $set: {
                  status: 'success',
                },
              },
            );
          }
          return {
            statusCode: HttpStatus.OK,
            message: 'User Details Updated successfull',
            data: edit,
          };
        } else {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Failed to Update User.',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User Not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async sendDeleteOtp(req: userDeleteDto) {
    try {
      const findUser = await this.userModel.findOne({
        userId: req.userId,
      });
      // console.log('....user details', findUser);
      if (findUser) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);

        const updateOTP = await this.userModel.updateOne(
          { userId: findUser.userId },
          { $set: { otp: generatedOtp } },
        );

        if (updateOTP.modifiedCount <= 0) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Unable to send OTP',
          };
        }

        const otpSent = await this.smsService.sendDeleteOtp(
          findUser.mobileNumber,
          generatedOtp,
        );

        if (otpSent) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Sent OTP Successfully',
          };
        } else {
          return {
            statusCode: HttpStatus.EXPECTATION_FAILED,
            message: 'Failed to send OTP',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async verifyDeleteAccount(req: userDeleteDto) {
    try {
      const findUser = await this.userModel.findOne({ userId: req.userId });
      // console.log("....deleteuser", findUser);
      if (!findUser) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      const otpResponse = await this.sendDeleteOtp(req);

      return otpResponse;

    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unable to verify',
      };
    }
  }

  async deleteUser(req: userDeleteDto) {
    try {
      const findUser = await this.userModel.findOne({ userId: req.userId });
      if (req.otp == findUser?.otp) {
        const deleteUser = await this.userModel.updateOne(
          { userId: req.userId },
          {
            $set: {
              status: 'inactive',
            },
          },
        );
        if (deleteUser) {
          return {
            statusCode: HttpStatus.OK,
            message: 'User deleted successfully',
          };
        }
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid OTP.',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async createCertificate(req: certificateDto, image) {
    try {
      if (image) {
        const reqDoc = image.map((doc, index) => {
          let IsPrimary = false;
          if (index == 0) {
            IsPrimary = true;
          }
          const randomNumber = Math.floor(Math.random() * 1000000 + 1);
          return doc.filename;
        });

        req.certificate = reqDoc.toString();
      }
      const add = await this.certificateModel.create(req);
      if (add) {
        await this.userModel.updateOne({userId: req.userId},{
          $set: {
            ekyc_status: EKYCstatus.PENDING
          }
        })
        return {
          statusCode: HttpStatus.OK,
          message: 'Certificate added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to add certificate',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getCertificates() {
    try {
      const findCertificates = await this.certificateModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'userId',
            as: 'userId',
          },
        },
      ]);
      if (findCertificates.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'List of Certificates',
          data: findCertificates,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No Certificates found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getCerticatesByUser(req: certificateDto) {
    try {
      const findCertificates = await this.certificateModel.find({
        userId: req.userId,
      });
      if (findCertificates) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Certificates List of Trainer',
          data: findCertificates,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No certificates found by this user',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async deleteCertificate(req: certificateDto) {
    try {
      const removeCertificate = await this.certificateModel.deleteOne({
        certificateId: req.certificateId,
      });
      if (removeCertificate) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Certificate Deleted Successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to delete certificate',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async addTrainerAvailability(req: trainerAvailabilityDto) {
    try {
      const start = new Date(req.startDateTime);
      const end = new Date(req.endDateTime);

      if (end < start) {
        throw new BadRequestException(
          'endDateTime must be after startDateTime',
        );
      }

      // Check for overlaps
      const overlap = await this.trainerEventsModel.findOne({
        userId: req.userId,
        startDateTime: { $lt: end },
        endDateTime: { $gt: start },
      });

      if (overlap) {
        throw new ConflictException(
          `Overlaps with existing event: "${overlap.title}" on ${overlap.startDateTime.toISOString()}`,
        );
      }

      const created = new this.trainerEventsModel({
        ...req,
        userId: req.userId,
        startDateTime: start,
        endDateTime: end,
      });

      return created.save();
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getTrainerEvents(req: trainerAvailabilityDto) {
    try {
      const getlist = await this.trainerEventsModel.find({
        userId: req.userId,
      });
      if (getlist.length > 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'List of user events',
          data: getlist,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User Events not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
