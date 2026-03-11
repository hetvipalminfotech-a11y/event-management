import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorAssignmentDto } from './create-vendor-assignment.dto';

export class UpdateVendorAssignmentDto extends PartialType(CreateVendorAssignmentDto) {}

