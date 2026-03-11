import { Module } from '@nestjs/common';
import { EventBookingsService } from './event-bookings.service';
import { EventBookingsController } from './event-bookings.controller';
import { EventBooking } from './entities/event-booking.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';
import { VendorAvailability } from 'src/vendors/entities/vendor-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventBooking, Vendor, VendorAssignment, VendorAvailability])],
  controllers: [EventBookingsController],
  providers: [EventBookingsService],
})
export class EventBookingsModule {}
