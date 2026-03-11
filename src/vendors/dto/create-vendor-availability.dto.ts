import { IsDateString, IsNumber, Min } from 'class-validator';

export class CreateVendorAvailabilityDto {

  @IsNumber()
  vendor_id!: string;

  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0)
  available_slots!: number;

}