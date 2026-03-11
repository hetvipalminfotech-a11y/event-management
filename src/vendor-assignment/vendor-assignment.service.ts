import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVendorAssignmentDto } from './dto/create-vendor-assignment.dto';
import { UpdateVendorAssignmentDto } from './dto/update-vendor-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorAssignment } from './entities/vendor-assignment.entity';
import { DeliveryStatus } from 'src/common/enums/delivery-status';
import { EventStatus } from 'src/common/enums/event-status';
import { EventBooking } from 'src/event-bookings/entities/event-booking.entity';

@Injectable()
export class VendorAssignmentService {
  constructor(
    @InjectRepository(VendorAssignment)
    private vendorassignmentRepo: Repository<VendorAssignment>,

    @InjectRepository(EventBooking)
    private eventbookingRepo: Repository<EventBooking>,
  ) {}
  async getVendorAssignments(vendorId: string) {

  return this.vendorassignmentRepo.find({
    where:{
      vendor:{ vendor_id: vendorId }
    },
    relations:['event_booking'],
    select:{
      id:true,
      delivery_status:true,
      event_booking:{
        booking_id:true,
        event_date:true
      }
    }
  });
}
async updateDeliveryStatus(
  vendorId: string,
  assignmentId: number,
  status: DeliveryStatus
){

  const assignment = await this.vendorassignmentRepo.findOne({
    where:{ id: assignmentId },
    relations:['vendor']
  });

  if(!assignment){
    throw new NotFoundException("Assignment not found");
  }

  if(assignment.vendor.vendor_id !== vendorId){
    throw new ForbiddenException(
      "You can update only your assignments"
    );
  }

  assignment.delivery_status = status;

  return this.vendorassignmentRepo.save(assignment);
}
async completeEvent(bookingId:string){

  const assignments = await this.vendorassignmentRepo.find({
    where:{
      event_booking:{ booking_id: bookingId }
    }
  });

  const allDone = assignments.every(
    a => a.delivery_status === DeliveryStatus.DONE
  );

  if(!allDone){
    throw new BadRequestException(
      "All vendors must complete their work first"
    );
  }

  const booking = await this.eventbookingRepo.findOne({
    where:{ booking_id: bookingId }
  });
  if(!booking){
  throw new NotFoundException("Booking not found");
}
  booking.event_status = EventStatus.COMPLETED;

  return this.eventbookingRepo.save(booking);
}
}
