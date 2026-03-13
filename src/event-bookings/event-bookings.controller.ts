import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';

import { EventBookingsService } from './event-bookings.service';

import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';

import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EventStatus } from 'src/common/enums/event-status';
import { UpdateEventStatusDto } from './dto/event-status.dto';
@ApiBearerAuth()
@Controller('event-bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventBookingsController {

  constructor(private readonly bookingService: EventBookingsService) {}

  // CREATE BOOKING
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  create(
    @Body() dto: CreateEventBookingDto,
    @Req() req:Request,
  ) {
    const userId = (req.user as any).id;
    return this.bookingService.create(dto, userId);
  }

  // GET ALL BOOKINGS
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  findAll() {
    return this.bookingService.findAll();
  }

  // GET ONE BOOKING
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }
@Patch(':id/status')
updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateEventStatusDto,
) {
  return this.bookingService.updateEventStatus(id, dto.status);
}
  // CANCEL BOOKING
  @Patch(':id/cancel')
@Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
cancelBooking(
  @Param('id') id: string
) {
  return this.bookingService.cancelBooking(id);
}
@Patch(':id/delete')
@Roles(UserRole.ADMIN)
softDeleteBooking(@Param('id') id: string) {
  return this.bookingService.softDeleteBooking(id);
}
}