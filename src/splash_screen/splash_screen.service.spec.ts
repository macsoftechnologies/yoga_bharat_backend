import { Test, TestingModule } from '@nestjs/testing';
import { SplashScreenService } from './splash_screen.service';

describe('SplashScreenService', () => {
  let service: SplashScreenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SplashScreenService],
    }).compile();

    service = module.get<SplashScreenService>(SplashScreenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
