import { Test, TestingModule } from '@nestjs/testing';
import { VendorAssignmentService } from './vendor-assignment.service';

describe('VendorAssignmentService', () => {
  let service: VendorAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorAssignmentService],
    }).compile();

    service = module.get<VendorAssignmentService>(VendorAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
