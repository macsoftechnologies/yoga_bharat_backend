import { Test, TestingModule } from '@nestjs/testing';
import { InAppNotificationsService } from './in-app-notifications.service';

describe('InAppNotificationsService', () => {
  let service: InAppNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InAppNotificationsService],
    }).compile();

    service = module.get<InAppNotificationsService>(InAppNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
