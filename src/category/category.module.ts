import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from './schema/category.schema';
import { YogaDetails, yogaDetailsSchema } from 'src/yoga/schema/yoga_details.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: categorySchema }, { name: YogaDetails.name, schema: yogaDetailsSchema }])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule { }
