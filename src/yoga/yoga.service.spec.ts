import { Test, TestingModule } from '@nestjs/testing';
import { YogaService } from './yoga.service';

describe('YogaService', () => {
  let service: YogaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YogaService],
    }).compile();

    service = module.get<YogaService>(YogaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
