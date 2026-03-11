import { PartialType } from '@nestjs/mapped-types';
import { CreateEventBookingDto } from './create-event-booking.dto';

export class UpdateEventBookingDto extends PartialType(CreateEventBookingDto) {}
