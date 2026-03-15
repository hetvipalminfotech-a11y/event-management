import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateVendorAssignmentDto {
  @ApiProperty()
  @IsNumber()
  booking_id!: string;

  @ApiProperty()
  @IsNumber()
  vendor_id!: string;

}