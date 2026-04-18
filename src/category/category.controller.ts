import { Body, Controller, Get, HttpStatus, Post, Query, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { categoryDto } from './dto/category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post('/add')
  async createCategory(@Body() req: categoryDto): Promise<object> {
    try {
      const add = await this.categoryService.addCategory(req);
      return add;
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  @Get('/')
  async getCategoriesList(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<object> {
    return this.categoryService.getCategories(Number(page), Number(limit));
  }

  @Get(':categoryId')
  async getCategoryById(@Param('categoryId') categoryId: string): Promise<object> {
    return this.categoryService.getCategoryById(categoryId);
  }
}