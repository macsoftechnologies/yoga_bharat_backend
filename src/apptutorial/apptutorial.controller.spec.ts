import { Test, TestingModule } from '@nestjs/testing';
import { ApptutorialController } from './apptutorial.controller';
import { ApptutorialService } from './apptutorial.service';

describe('ApptutorialController', () => {
  let controller: ApptutorialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApptutorialController],
      providers: [ApptutorialService],
    }).compile();

    controller = module.get<ApptutorialController>(ApptutorialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
