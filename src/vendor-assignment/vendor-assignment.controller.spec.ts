import { Test, TestingModule } from '@nestjs/testing';
import { VendorAssignmentsController } from './vendor-assignment.controller';
import { VendorAssignmentsService } from './vendor-assignment.service';

describe('VendorAssignmentController', () => {
  let controller: VendorAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorAssignmentsController],
      providers: [VendorAssignmentsService],
    }).compile();

    controller = module.get<VendorAssignmentsController>(VendorAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
