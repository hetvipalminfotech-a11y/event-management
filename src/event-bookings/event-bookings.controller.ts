import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EventBookingsService } from './event-bookings.service';

import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';

import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { Request } from 'express';
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

  // CANCEL BOOKING
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(id, dto);
  }
}