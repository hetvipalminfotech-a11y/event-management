  import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException
  } from '@nestjs/common';

  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';

  import { VendorAssignment } from './entities/vendor-assignment.entity';
  import { EventBooking } from '../event-bookings/entities/event-booking.entity';

  import { DeliveryStatus } from '../common/enums/delivery-status';
  import { AssignmentStatus } from '../common/enums/assignment-status.enum';
  import { EventStatus } from '../common/enums/event-status';

  @Injectable()
  export class VendorAssignmentsService {

    constructor(
      @InjectRepository(VendorAssignment)
      private readonly assignmentRepo: Repository<VendorAssignment>,

      @InjectRepository(EventBooking)
      private readonly bookingRepo: Repository<EventBooking>,
    ) {}

    // Vendor sees only their assignments
    async getVendorAssignments(vendorId: string): Promise<VendorAssignment[]> {

      const assignments = await this.assignmentRepo.find({
        where: {
          vendor: { vendor_id: vendorId }
        },
        relations: ['event_booking'],
        select: {
          id: true,
          delivery_status: true,
          assignment_status: true,
          event_booking: {
            booking_id: true,
            event_date: true,
            event_type: true,
            guest_count: true
          }
        }
      });

      return assignments;
    }


    // Vendor updates delivery status
    async updateDeliveryStatus(
      vendorId: string,
      assignmentId: number,
      newStatus: DeliveryStatus
    ): Promise<VendorAssignment> {

      const assignment = await this.assignmentRepo.findOne({
        where: { id: assignmentId },
        relations: ['vendor']
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      // vendor ownership check
      if (assignment.vendor.vendor_id !== vendorId) {
        throw new ForbiddenException('You can update only your assignments');
      }

      const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {

        [DeliveryStatus.PENDING]: [DeliveryStatus.ARRANGED],
        [DeliveryStatus.ARRANGED]: [DeliveryStatus.DELIVERED],
        [DeliveryStatus.DELIVERED]: [DeliveryStatus.DONE],
        [DeliveryStatus.DONE]:[],
        [DeliveryStatus.CANCELLED]: []

      };

      const allowed = transitions[assignment.delivery_status];

      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Invalid delivery status transition`
        );
      }

      assignment.delivery_status = newStatus;

      return this.assignmentRepo.save(assignment);
    }


    // Admin/Event Manager view assignments for event
    async getAssignmentsByEvent(
      bookingId: string
    ): Promise<VendorAssignment[]> {

      const assignments = await this.assignmentRepo.find({
        where: {
          event_booking: { booking_id: bookingId }
        },
        relations: ['vendor']
      });

      if (!assignments.length) {
        throw new NotFoundException(
          'No vendor assignments found for this event'
        );
      }

      return assignments;
    }


    // Admin/Event Manager view single assignment
    async getAssignmentById(id: number): Promise<VendorAssignment> {

      const assignment = await this.assignmentRepo.findOne({
        where: { id },
        relations: ['vendor', 'event_booking']
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      return assignment;
    }


    // Cancel vendor assignment
    async cancelAssignment(id: number): Promise<VendorAssignment> {

      const assignment = await this.assignmentRepo.findOne({
        where: { id }
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      assignment.assignment_status = AssignmentStatus.CANCELLED;

      return this.assignmentRepo.save(assignment);
    }


    // Event Manager completes event
    async completeEvent(bookingId: string): Promise<EventBooking> {

      const assignments = await this.assignmentRepo.find({
        where: {
          event_booking: { booking_id: bookingId }
        }
      });

      if (!assignments.length) {
        throw new NotFoundException(
          'No assignments found for this booking'
        );
      }

      const allDone = assignments.every(
        a => a.delivery_status === DeliveryStatus.DONE
      );

      if (!allDone) {
        throw new BadRequestException(
          'All vendors must complete delivery first'
        );
      }

      const booking = await this.bookingRepo.findOne({
        where: { booking_id: bookingId }
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      booking.event_status = EventStatus.COMPLETED;

      return this.bookingRepo.save(booking);
    }


    // Admin delete assignment
async deleteAssignment(id: number): Promise<{ message: string }> {

  const assignment = await this.assignmentRepo.findOne({
    where: { id }
  });

  if (!assignment) {
    throw new NotFoundException('Assignment not found');
  }

  // mark status inactive
  assignment.status = false;   // or 0 depending on your column type
  await this.assignmentRepo.save(assignment);

  // soft delete (sets deleted_at)
  await this.assignmentRepo.softDelete(id);

  return { message: 'Assignment deleted successfully' };
}

  }