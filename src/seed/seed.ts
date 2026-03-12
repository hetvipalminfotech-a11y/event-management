import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../app.module';

import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorAvailability } from '../vendors/entities/vendor-availability.entity';
import { EventBooking } from '../event-bookings/entities/event-booking.entity';
import { VendorAssignment } from '../vendor-assignment/entities/vendor-assignment.entity';

import { UserRole } from '../common/enums/user-role.enum';
import { ServiceType } from '../common/enums/service-type.enum';
import { VendorStatus } from '../common/enums/vendor-status.enum';
import { EventType } from '../common/enums/event-type.enum';
import { EventStatus } from '../common/enums/event-status';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';
import { DeliveryStatus } from '../common/enums/delivery-status';
import { AvailabilityStatus } from '../common/enums/availability-status.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const vendorRepo = app.get<Repository<Vendor>>(getRepositoryToken(Vendor));
  const availabilityRepo = app.get<Repository<VendorAvailability>>(
    getRepositoryToken(VendorAvailability),
  );
  const bookingRepo = app.get<Repository<EventBooking>>(
    getRepositoryToken(EventBooking),
  );
  const assignmentRepo = app.get<Repository<VendorAssignment>>(
    getRepositoryToken(VendorAssignment),
  );

  // prevent multiple seed runs
  const userCount = await userRepo.count();

  if (userCount > 0) {
    console.log('Database already seeded');
    process.exit();
  }

  const password = await bcrypt.hash('password123', 10);

  /*
  USERS
  */

  const admin = userRepo.create({
    name: 'Admin',
    email: 'admin@test.com',
    password,
    role: UserRole.ADMIN,
  });

  const manager = userRepo.create({
    name: 'Event Manager',
    email: 'manager@test.com',
    password,
    role: UserRole.EVENT_MANAGER,
  });

  const vendorUser = userRepo.create({
    name: 'Vendor User',
    email: 'vendor@test.com',
    password,
    role: UserRole.VENDOR,
  });

  await userRepo.save([admin, manager, vendorUser]);

  /*
  VENDORS
  */

  const serviceTypes = [
    ServiceType.CATERING,
    ServiceType.DECORATION,
    ServiceType.PHOTOGRAPHY,
    ServiceType.DJ,
    ServiceType.MAKEUP,
    ServiceType.VENUE,
  ];
  const year = new Date().getFullYear();
  const vendors: Vendor[] = [];

  for (let i = 1; i <= 10; i++) {
    const vendorId = `VEN-${year}-${String(i).padStart(3, '0')}`;
    const vendor = vendorRepo.create({
      vendor_id: vendorId,
      vendor_name: `Vendor ${i}`,
      business_name: `Business ${i}`,
      contact_number: `987654321${i}`,
      service_area: 'Surat',

      service_type: serviceTypes[i % serviceTypes.length],

      vendor_cost: 10000 + i * 1000,
      package_price: 15000 + i * 1500,

      max_events_per_day: 3,
      rating: 4.5,

      vendor_status: VendorStatus.ACTIVE,
      user: vendorUser,
    });

    vendors.push(vendor);
  }

  await vendorRepo.save(vendors);

  /*
  AVAILABILITY
  */

  const availabilities: VendorAvailability[] = [];

  for (let i = 0; i < 20; i++) {
    const vendor = vendors[i % vendors.length];

    const availability = availabilityRepo.create({
      vendor,
      date: new Date(2026, 0, (i % 28) + 1),

      maximum_capacity: 3,
      booked_count: 0,
      available_slots: 3,

      availability_status: AvailabilityStatus.AVAILABLE,
    });

    availabilities.push(availability);
  }

  await availabilityRepo.save(availabilities);

  /*
  BOOKINGS
  */

  const eventTypes = [
    EventType.WEDDING,
    EventType.BIRTHDAY,
    EventType.CORPORATE,
  ];
  // const year = new Date().getFullYear();
  const bookings: EventBooking[] = [];

  for (let i = 1; i <= 15; i++) {
    const bookingId = `EVENT-${year}-${String(i).padStart(3, '0')}`;
    const booking = bookingRepo.create({
      booking_id: bookingId,

      customer_name: `Customer ${i}`,
      customer_phone: `900000000${i}`,

      event_type: eventTypes[i % eventTypes.length],

      event_date: new Date(2026, 0, (i % 28) + 1),

      guest_count: 200 + i * 10,

      total_cost: 0,
      total_package: 0,

      event_status: EventStatus.BOOKED,

      created_by: manager,
    });

    bookings.push(booking);
  }

  await bookingRepo.save(bookings);

  /*
  ASSIGNMENTS
  */

  const assignments: VendorAssignment[] = [];

  for (let i = 0; i < 30; i++) {
    const booking = bookings[i % bookings.length];
    const vendor = vendors[i % vendors.length];

    const assignment = assignmentRepo.create({
      event_booking: booking,
      vendor,

      vendor_cost_snapshot: vendor.vendor_cost,
      package_price_snapshot: vendor.package_price,

      assignment_status: AssignmentStatus.ACTIVE,

      delivery_status:
        i % 4 === 0
          ? DeliveryStatus.PENDING
          : i % 4 === 1
            ? DeliveryStatus.ARRANGED
            : i % 4 === 2
              ? DeliveryStatus.DELIVERED
              : DeliveryStatus.DONE,
    });

    assignments.push(assignment);
  }

  await assignmentRepo.save(assignments);

  console.log('Seed completed successfully');

  process.exit();
}

seed();
