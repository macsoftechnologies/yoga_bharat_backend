import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Language } from './schema/language.schema';
import { Model } from 'mongoose';
import { languageDto } from './dto/language.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectModel(Language.name) private readonly languageModel: Model<Language>,
  ) {}

  async addlanguage(req: languageDto) {
    try {
      const add = await this.languageModel.create(req);
      if (add) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Language added successfully',
          data: add,
        };
      } else {
        return {
          statusCode: HttpStatus.EXPECTATION_FAILED,
          message: 'Failed to add Language',
        };
      }
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }
  }

  async getLanguageList() {
    try{
        const list = await this.languageModel.find();
        if(list.length > 0) {
            return {
                statusCode: HttpStatus.OK,
                message: "List of languages",
                data: list
            }
        } else {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "No languages found"
            }
        }
    } catch(error) {
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error,
        }
    }
  }

  async getLanguageById(req: languageDto) {
    try{
        const findLanguage = await this.languageModel.findOne({languageId: req.languageId});
        if(findLanguage) {
            return {
                statusCode: HttpStatus.OK,
                message: "Details of Language",
                data: findLanguage
            }
        } else {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Language not found"
            }
        }
    } catch(error){
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error
        }
    }
  }

  async updateLanguage(req: languageDto) {
    try{
        const findLanguage = await this.languageModel.findOne({languageId: req.languageId});
        if(findLanguage) {
            const modifyLanguage = await this.languageModel.updateOne({languageId: req.languageId},{
                $set: {
                    language_name: req.language_name,
                    special_character: req.special_character
                }
            });
            if(modifyLanguage) {
                return {
                    statusCode: HttpStatus.OK,
                    message: "Language updated successfully",
                }
            } else {
                return {
                    statusCode: HttpStatus.EXPECTATION_FAILED,
                    message: "Failed to udpdate language",
                }
            }
        } else {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Language not found",
            }
        }
    } catch(error) {
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error
        }
    }
  } 

  async deleteLanguage(req: languageDto) {
    try{
        const removeLanguage = await this.languageModel.deleteOne({languageId: req.languageId});
        if(removeLanguage) {
            return {
                statusCode: HttpStatus.OK,
                message: "Language deleted successfully"
            }
        } else {
            return {
                statusCode: HttpStatus.EXPECTATION_FAILED,
                message: "Failed to delete Language"
            }
        }
    } catch(error) {
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: error
        }
    }
  }
}
