import { Test, TestingModule } from '@nestjs/testing';
import { SessionStatusController } from './session-status.controller';
import { SessionStatusService } from './session-status.service';

describe('SessionStatusController', () => {
  let controller: SessionStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionStatusController],
      providers: [SessionStatusService],
    }).compile();

    controller = module.get<SessionStatusController>(SessionStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
