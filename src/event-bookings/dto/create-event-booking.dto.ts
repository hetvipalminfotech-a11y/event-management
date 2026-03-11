import { IsDateString, IsEnum, IsNumber, IsString, Min, IsArray } from 'class-validator';
import { EventType } from '../../common/enums/event-type.enum';

export class CreateEventBookingDto {

  @IsString()
  customer_name!: string;

  @IsString()
  customer_phone!: string;

  @IsEnum(EventType)
  event_type!: EventType;

  @IsDateString()
  event_date!: string;

  @IsNumber()
  @Min(1)
  guest_count!: number;

  @IsArray()
  vendor_ids!: string[];

}