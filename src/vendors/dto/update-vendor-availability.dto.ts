import { IsNumber, Min } from 'class-validator';

export class UpdateVendorAvailabilityDto {

  @IsNumber()
  @Min(0)
  available_slots!: number;

}