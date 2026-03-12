import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { EventBooking } from './entities/event-booking.entity';
import { VendorAvailability } from 'src/vendors/entities/vendor-availability.entity';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';

import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

import { EventStatus } from 'src/common/enums/event-status';
import { VendorStatus } from 'src/common/enums/vendor-status.enum';
import { DeliveryStatus } from 'src/common/enums/delivery-status';

@Injectable()
export class EventBookingsService {

  constructor(
    @InjectRepository(EventBooking)
    private eventbookinRepo: Repository<EventBooking>,

    @InjectRepository(VendorAvailability)
    private vendoravailableRepo: Repository<VendorAvailability>,

    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,

    @InjectRepository(VendorAssignment)
    private assignmentRepo: Repository<VendorAssignment>,

    private dataSource: DataSource,
  ) {}

  // Generate booking ID
  async generateBookingId(): Promise<string> {

    const year = new Date().getFullYear();

    const lastBooking = await this.eventbookinRepo
      .createQueryBuilder('booking')
      .where('booking.booking_id LIKE :pattern', {
        pattern: `EVENT-${year}-%`,
      })
      .orderBy('booking.booking_id', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastBooking?.booking_id) {
      const lastSequence = lastBooking.booking_id.split('-').pop();
      const lastNumber = Number(lastSequence);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const formatted = String(nextNumber).padStart(3, '0');

    return `EVENT-${year}-${formatted}`;
  }

  // CREATE BOOKING
  async create(dto: CreateEventBookingDto, userId: number) {

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const bookingId = await this.generateBookingId();

      const vendors = await this.vendorRepo.find({
        where: { vendor_id: In(dto.vendor_ids) },
      });

      if (vendors.length !== dto.vendor_ids.length) {
        throw new NotFoundException('Some vendors not found');
      }

      // validate vendors
      for (const vendor of vendors) {

        if (vendor.vendor_status === VendorStatus.INACTIVE) {
          throw new UnprocessableEntityException(
            `Vendor ${vendor.vendor_name} is inactive`,
          );
        }

        if (Number(vendor.package_price) <= Number(vendor.vendor_cost)) {
          throw new UnprocessableEntityException(
            `Vendor ${vendor.vendor_name} has invalid pricing`,
          );
        }
      }

      // check availability
      const unavailable: string[] = [];

      const availabilities: VendorAvailability[] = [];

      for (const vendor of vendors) {

        const availability = await this.vendoravailableRepo.findOne({
          where: {
            vendor: { vendor_id: vendor.vendor_id },
            date: new Date(dto.event_date),
          },
        });

        if (!availability || availability.available_slots <= 0) {
          unavailable.push(vendor.vendor_name);
        }

        if (availability) {
          availabilities.push(availability);
        }
      }

      if (unavailable.length) {
        throw new ConflictException(
          `Unavailable vendors: ${unavailable.join(', ')}`,
        );
      }

      // calculate totals
      let totalCost = 0;
      let totalPackage = 0;

      vendors.forEach((vendor) => {
        totalCost += Number(vendor.vendor_cost);
        totalPackage += Number(vendor.package_price);
      });

      // create booking
      const booking = queryRunner.manager.create(EventBooking, {
        booking_id: bookingId,
        customer_name: dto.customer_name,
        customer_phone: dto.customer_phone,
        event_type: dto.event_type,
        event_date: new Date(dto.event_date),
        guest_count: dto.guest_count,
        total_cost: totalCost,
        total_package: totalPackage,
        event_status: EventStatus.BOOKED,
        created_by: { id: userId },
      });

      await queryRunner.manager.save(booking);

      // create vendor assignments
      for (const vendor of vendors) {

        const assignment = queryRunner.manager.create(VendorAssignment, {
          event_booking: booking,
          vendor: vendor,
          vendor_cost_snapshot: vendor.vendor_cost,
          package_price_snapshot: vendor.package_price,
          delivery_status: DeliveryStatus.PENDING,
        });

        await queryRunner.manager.save(assignment);
      }

      // reduce availability
      for (const availability of availabilities) {

        availability.available_slots -= 1;

        await queryRunner.manager.save(availability);
      }

      await queryRunner.commitTransaction();

      return booking;

    } catch (error) {

      await queryRunner.rollbackTransaction();
      throw error;

    } finally {

      await queryRunner.release();

    }
  }

  // GET ALL BOOKINGS
  async findAll() {
    return this.eventbookinRepo.find({
      relations: ['vendor_assignments', 'vendor_assignments.vendor'],
    });
  }

  // GET ONE BOOKING
  async findOne(id: string) {

    const booking = await this.eventbookinRepo.findOne({
      where: { booking_id: id },
      relations: ['vendor_assignments', 'vendor_assignments.vendor'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // CANCEL BOOKING
  async cancelBooking(id: string, dto: CancelBookingDto) {

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const booking = await this.eventbookinRepo.findOne({
        where: { booking_id: id },
        relations: ['vendor_assignments', 'vendor_assignments.vendor'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      for (const assignment of booking.vendor_assignments) {

        const availability = await this.vendoravailableRepo.findOne({
          where: {
            vendor: { vendor_id: assignment.vendor.vendor_id },
            date: booking.event_date,
          },
        });

        if (availability) {
          availability.available_slots += 1;
          await queryRunner.manager.save(availability);
        }

        assignment.delivery_status = DeliveryStatus.CANCELLED;

        await queryRunner.manager.save(assignment);
      }

      booking.event_status = dto.event_status;

      await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();

      return booking;

    } catch (error) {

      await queryRunner.rollbackTransaction();
      throw error;

    } finally {

      await queryRunner.release();

    }
  }

}