import { Test, TestingModule } from '@nestjs/testing';
import { SessionStatusService } from './session-status.service';

describe('SessionStatusService', () => {
  let service: SessionStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionStatusService],
    }).compile();

    service = module.get<SessionStatusService>(SessionStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
