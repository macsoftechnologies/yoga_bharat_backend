import { Test, TestingModule } from '@nestjs/testing';
import { SplashScreenController } from './splash_screen.controller';
import { SplashScreenService } from './splash_screen.service';

describe('SplashScreenController', () => {
  let controller: SplashScreenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SplashScreenController],
      providers: [SplashScreenService],
    }).compile();

    controller = module.get<SplashScreenController>(SplashScreenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
