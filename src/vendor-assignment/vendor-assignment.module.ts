import { Module } from '@nestjs/common';
import { VendorAssignmentsService } from './vendor-assignment.service';
import { VendorAssignmentsController } from './vendor-assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorAssignment } from './entities/vendor-assignment.entity';
import { EventBooking } from 'src/event-bookings/entities/event-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VendorAssignment, EventBooking])],
  controllers: [VendorAssignmentsController],
  providers: [VendorAssignmentsService],
})
export class VendorAssignmentModule {}
