import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateVendorAvailabilityDto {

  @ApiProperty()
  @IsNumber()
  @Min(0)
  available_slots!: number;

}