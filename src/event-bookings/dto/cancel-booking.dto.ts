import { IsEnum } from 'class-validator';
import { EventStatus } from '../../common/enums/event-status';

export class CancelBookingDto {

  @IsEnum(EventStatus)
  event_status!: EventStatus;

}