import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateVendorAvailabilityDto {
  @ApiProperty()
  @IsString()
  vendor_id!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  available_slots!: number;

}