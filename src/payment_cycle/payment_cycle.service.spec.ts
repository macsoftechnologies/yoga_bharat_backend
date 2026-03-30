import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCycleService } from './payment_cycle.service';

describe('PaymentCycleService', () => {
  let service: PaymentCycleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentCycleService],
    }).compile();

    service = module.get<PaymentCycleService>(PaymentCycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
