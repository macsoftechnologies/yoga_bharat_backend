import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCycleController } from './payment_cycle.controller';
import { PaymentCycleService } from './payment_cycle.service';

describe('PaymentCycleController', () => {
  let controller: PaymentCycleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentCycleController],
      providers: [PaymentCycleService],
    }).compile();

    controller = module.get<PaymentCycleController>(PaymentCycleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
