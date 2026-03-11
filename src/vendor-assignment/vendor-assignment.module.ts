import { Module } from '@nestjs/common';
import { VendorAssignmentService } from './vendor-assignment.service';
import { VendorAssignmentController } from './vendor-assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorAssignment } from './entities/vendor-assignment.entity';
import { EventBooking } from 'src/event-bookings/entities/event-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VendorAssignment, EventBooking])],
  controllers: [VendorAssignmentController],
  providers: [VendorAssignmentService],
})
export class VendorAssignmentModule {}
