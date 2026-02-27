import { Test, TestingModule } from '@nestjs/testing';
import { PassedOrdersController } from './passed_orders.controller';
import { PassedOrdersService } from './passed_orders.service';

describe('PassedOrdersController', () => {
  let controller: PassedOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassedOrdersController],
      providers: [PassedOrdersService],
    }).compile();

    controller = module.get<PassedOrdersController>(PassedOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
