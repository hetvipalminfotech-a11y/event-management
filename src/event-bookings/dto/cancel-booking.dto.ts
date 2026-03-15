import { IsEnum } from 'class-validator';
import { EventStatus } from '../../common/enums/event-status';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBookingDto {

  @ApiProperty()
  @IsEnum(EventStatus)
  event_status!: EventStatus;

}