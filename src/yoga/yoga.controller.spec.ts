import { Test, TestingModule } from '@nestjs/testing';
import { YogaController } from './yoga.controller';
import { YogaService } from './yoga.service';

describe('YogaController', () => {
  let controller: YogaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YogaController],
      providers: [YogaService],
    }).compile();

    controller = module.get<YogaController>(YogaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
