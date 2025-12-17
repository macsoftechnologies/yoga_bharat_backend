import { Test, TestingModule } from '@nestjs/testing';
import { ApptutorialService } from './apptutorial.service';

describe('ApptutorialService', () => {
  let service: ApptutorialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApptutorialService],
    }).compile();

    service = module.get<ApptutorialService>(ApptutorialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
