import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventBookingsService } from './event-bookings.service';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { UpdateEventBookingDto } from './dto/update-event-booking.dto';

@Controller('event-bookings')
export class EventBookingsController {
  constructor(private readonly eventBookingsService: EventBookingsService) {}

  // @Post()
  // create(@Body() createEventBookingDto: CreateEventBookingDto) {
  //   return this.eventBookingsService.create(createEventBookingDto);
  // }

  // @Get()
  // findAll() {
  //   return this.eventBookingsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.eventBookingsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEventBookingDto: UpdateEventBookingDto) {
  //   return this.eventBookingsService.update(+id, updateEventBookingDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.eventBookingsService.remove(+id);
  // }
}
