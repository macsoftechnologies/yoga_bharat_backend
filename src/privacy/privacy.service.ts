import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Privacy } from './schema/privacy.schema';
import { privacyDto } from './tdo/privacy.dto';
@Injectable()
export class PrivacyService {
  constructor(
    @InjectModel(Privacy.name)
    private readonly privacyModel: Model<Privacy>,
  ) {}
  async addprivacy(req: privacyDto) {
    try {
      const add = await this.privacyModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privacy data added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add Privacy data',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getPrivacy() {
    try {
      const list = await this.privacyModel.find().exec();

      if (list) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privacy list fetched successfully',
          data: list,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to fetch Privacy list',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async privacyById(privacyId: string) {
    try {
      const byid = await this.privacyModel.findOne({ privacyId }).exec();
      if (byid) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privacy By id fetched successfully',
          data: byid,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Privacy detail not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async updatePrivacy(req: privacyDto) {
    try {
      const update = await this.privacyModel
        .findOneAndUpdate(
          { privacyId: req.privacyId },
          { $set: req },
          { new: true },
        )
        .exec();
      if (update) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privcy updated successfully',
          data: update,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Privacy not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async deletePrivacy(privacyId: string) {
    try {
      const del = await this.privacyModel
        .findOneAndDelete({ privacyId })
        .exec();
      if (del) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privacy deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Privacy not found',
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
