import { Test, TestingModule } from '@nestjs/testing';
import { VendorAssignmentController } from './vendor-assignment.controller';
import { VendorAssignmentService } from './vendor-assignment.service';

describe('VendorAssignmentController', () => {
  let controller: VendorAssignmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorAssignmentController],
      providers: [VendorAssignmentService],
    }).compile();

    controller = module.get<VendorAssignmentController>(VendorAssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
