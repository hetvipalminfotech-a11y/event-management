import { IsDateString, IsEnum, IsNumber, IsString, Min, IsArray } from 'class-validator';
import { EventType } from '../../common/enums/event-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventBookingDto {
  @ApiProperty()
  @IsString()
  customer_name!: string;
  @ApiProperty()
  @IsString()
  customer_phone!: string;
  @ApiProperty()
  @IsEnum(EventType)
  event_type!: EventType;
  @ApiProperty()
  @IsDateString()
  event_date!: string;
  @ApiProperty()
  @IsNumber()
  @Min(1)
  guest_count!: number;
  @ApiProperty()
  @IsArray()
  vendor_ids!: string[];

}