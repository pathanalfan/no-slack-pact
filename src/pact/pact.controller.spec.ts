import { Test, TestingModule } from '@nestjs/testing';
import { PactController } from './pact.controller';

describe('PactController', () => {
  let controller: PactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PactController],
    }).compile();

    controller = module.get<PactController>(PactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
