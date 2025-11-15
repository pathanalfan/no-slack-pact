import { Test, TestingModule } from '@nestjs/testing';
import { PactService } from './pact.service';

describe('PactService', () => {
  let service: PactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PactService],
    }).compile();

    service = module.get<PactService>(PactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
