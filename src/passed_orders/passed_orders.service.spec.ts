import { Test, TestingModule } from '@nestjs/testing';
import { PassedOrdersService } from './passed_orders.service';

describe('PassedOrdersService', () => {
  let service: PassedOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PassedOrdersService],
    }).compile();

    service = module.get<PassedOrdersService>(PassedOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
