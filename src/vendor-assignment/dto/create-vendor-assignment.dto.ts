import { IsNumber } from 'class-validator';

export class CreateVendorAssignmentDto {

  @IsNumber()
  booking_id!: string;

  @IsNumber()
  vendor_id!: string;

}