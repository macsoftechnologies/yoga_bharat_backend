import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Terms } from './schema/terms.schema';
import { termsDto } from './tdo/terms.dto';
@Injectable()
export class TermsService {
  constructor(
    @InjectModel(Terms.name)
    private readonly termsModel: Model<Terms>,
  ) {}
  async addterms(req: termsDto) {
    try {
      const add = await this.termsModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Terms data added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add Terms data',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async getterms(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [getList, totalCount] = await Promise.all([
        this.termsModel.find().skip(skip).limit(limit),
        this.termsModel.countDocuments(),
      ]);
      return {
        statusCode: HttpStatus.OK,
        message: 'List of Terms & Conditions',
        totalCount: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
        data: getList,
      };
      // const list = await this.termsModel.find();

      // if (list) {
      //   return {
      //     statusCode: HttpStatus.OK,
      //     message: 'Terms list fetched successfully',
      //     data: list,
      //   };
      // } else {
      //   return {
      //     statusCode: HttpStatus.EXPECTATION_FAILED,
      //     message: 'Failed to fetch Terms list',
      //   };
      // }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async termsByID(req: termsDto) {
    try {
      const byid = await this.termsModel.findOne({ termsId: req.termsId });
      if (byid) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Terms By id fetched successfully',
          data: byid,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Terms detail not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async updateTerms(req: termsDto) {
    try {
      const update = await this.termsModel.updateOne(
        { termsId: req.termsId },
        {
          $set: {
            status: req.status,
            terms_and_conditions: req.terms_and_conditions,
            message: req.message,
            usertype: req.usertype,
          },
        },
      );
      if (update) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Privcy updated successfully',
          data: update,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Terms not found',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }
  async deleteTerms(req: termsDto) {
    try {
      const del = await this.termsModel.deleteOne({ termsId: req.termsId });
      if (del) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Terms deleted successfully',
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Terms not found',
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
