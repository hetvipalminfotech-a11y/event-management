import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { UpdateEventBookingDto } from './dto/update-event-booking.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventBooking } from './entities/event-booking.entity';
import { VendorAvailability } from 'src/vendors/entities/vendor-availability.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { DataSource } from 'typeorm';
import { In } from 'typeorm';
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

  private dataSource: DataSource,
) {}
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
async checkVendorAvailability(
  vendorIds: string[],
  date: Date,
): Promise<void> {

  const unavailable: string[] = [];

  for (const vendorId of vendorIds) {

    const availability = await this.vendoravailableRepo.findOne({
      where: {
        vendor: { vendor_id: vendorId },
        date: date,
      },
      relations: ['vendor'],
    });

    if (!availability || availability.available_slots <= 0) {
      unavailable.push(availability?.vendor?.vendor_name || `Vendor ${vendorId}`);
    }
  }

  if (unavailable.length > 0) {
    throw new UnprocessableEntityException({
      message: 'Some vendors are unavailable',
      vendors: unavailable,
    });
  }
}
async createBooking(dto: CreateEventBookingDto) {

  return this.dataSource.transaction(async manager => {

    const vendors = await manager.find(Vendor,{
      where:{ vendor_id: In(dto.vendor_ids) }
    });

    // Check vendor active
    vendors.forEach(v => {
      if(v.vendor_status !== VendorStatus.ACTIVE){
        throw new UnprocessableEntityException(
          `Vendor ${v.vendor_name} is inactive`
        );
      }
    });

    // Check availability
    for(const vendorId of dto.vendor_ids){

      const availability = await manager.findOne(VendorAvailability,{
        where:{
          vendor:{ vendor_id: vendorId },
          date:new Date(dto.event_date)
        },
        relations:['vendor']
      });

      if(!availability || availability.available_slots <= 0){
        throw new UnprocessableEntityException(
          `Vendor ${vendorId} not available on this date`
        );
      }
    }

    // Calculate totals
    let totalCost = 0;
    let totalPackage = 0;

    vendors.forEach(v => {
      totalCost += Number(v.vendor_cost);
      totalPackage += Number(v.package_price);
    });

    // Generate booking id
    const bookingId = await this.generateBookingId();

    const booking = manager.create(EventBooking,{
      booking_id: bookingId,
      customer_name: dto.customer_name,
      event_date:new Date(dto.event_date),
      guest_count:dto.guest_count,
      total_cost: totalCost,
      total_package: totalPackage
    });

    await manager.save(booking);

    // Assign vendors
    for(const vendorId of dto.vendor_ids){

      const assignment = manager.create(VendorAssignment,{
        vendor:{ vendor_id: vendorId },
        event_booking: booking
      });

      await manager.save(assignment);

      const availability = await manager.findOne(VendorAvailability,{
        where:{
          vendor:{ vendor_id: vendorId },
          date:new Date(dto.event_date)
        }
      });
     if (!availability) {
  throw new UnprocessableEntityException(
    `Vendor ${vendorId} availability not found`
  );
}

      availability.booked_count += 1;
      availability.available_slots -= 1;

      await manager.save(availability);
    }

    return booking;

  });
}
async calculateTotals(vendorIds: string[]) {

  const vendors = await this.vendorRepo.find({
    where:{
      vendor_id: In(vendorIds)
    }
  });

  let totalVendorCost = 0;
  let totalPackagePrice = 0;

  vendors.forEach(vendor => {
    totalVendorCost += Number(vendor.vendor_cost);
    totalPackagePrice += Number(vendor.package_price);
  });

  return {
    totalVendorCost,
    totalPackagePrice
  };
}
async cancelBooking(bookingId: string){

  return this.dataSource.transaction(async manager => {

    const booking = await manager.findOne(EventBooking,{
      where:{ booking_id: bookingId },
      relations:['vendor_assignments','vendor_assignments.vendor']
    });

    if(!booking){
      throw new NotFoundException("Booking not found");
    }

    booking.event_status = EventStatus.CANCELLED;
    await manager.save(booking);

    for(const assignment of booking.vendor_assignments){

      assignment.delivery_status = DeliveryStatus.CANCELLED;
      await manager.save(assignment);

      const availability = await manager.findOne(VendorAvailability,{
        where:{
          vendor:{ vendor_id: assignment.vendor.vendor_id },
          date: booking.event_date
        }
      });
        if (!availability) {
        throw new NotFoundException(
          `Availability not found for vendor ${assignment.vendor.vendor_id}`
        );
      }

      availability.booked_count -= 1;
      availability.available_slots += 1;

      await manager.save(availability);
    }

    return {
      message:"Booking cancelled successfully"
    };
  });
}
}
