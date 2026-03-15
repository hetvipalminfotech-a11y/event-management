import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateVendorAvailabilityDto } from './dto/create-vendor-availability.dto';
import { UpdateVendorAvailabilityDto } from './dto/update-vendor-availability.dto';
import { User } from '../users/entities/user.entity';
import { VendorStatus } from '../common/enums/vendor-status.enum';
import { AvailabilityStatus } from '../common/enums/availability-status.enum';
import { ServiceType } from 'src/common/enums/service-type.enum';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';
import { SearchVendorDto } from './dto/search-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorAvailability)
    private readonly availabilityRepo: Repository<VendorAvailability>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(VendorAssignment)
    private readonly assignmentRepo: Repository<VendorAssignment>,

    private readonly dataSource: DataSource,
  ) {}

  async generateVendorId(): Promise<string> {
    const year = new Date().getFullYear();

    const lastVendor = await this.vendorRepo
      .createQueryBuilder('vendor')
      .where('vendor.vendor_id LIKE :pattern', {
        pattern: `VEN-${year}-%`,
      })
      .orderBy('vendor.vendor_id', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastVendor?.vendor_id) {
      const lastSequence = lastVendor.vendor_id.split('-').pop();
      const lastNumber = Number(lastSequence);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const formatted = String(nextNumber).padStart(3, '0');

    return `VEN-${year}-${formatted}`;
  }

  // ---------------- Vendor CRUD ----------------
  async createVendor(dto: CreateVendorDto, userId: number): Promise<Vendor> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.package_price <= dto.vendor_cost)
      throw new BadRequestException(
        'Package price must be greater than vendor cost',
      );

    const vendor = this.vendorRepo.create({
      ...dto,
      vendor_id: await this.generateVendorId(),
      user,
    });
    return this.vendorRepo.save(vendor);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { vendor_id: vendorId },
      relations: ['user', 'vendorAvailabilities'],
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(vendorId: string, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(vendorId);
    if (
      dto.package_price &&
      dto.vendor_cost &&
      dto.package_price <= dto.vendor_cost
    )
      throw new BadRequestException(
        'Package price must be greater than vendor cost',
      );

    Object.assign(vendor, dto);
    return this.vendorRepo.save(vendor);
  }

  async deactivateVendor(vendorId: string): Promise<Vendor> {
    const vendor = await this.findOne(vendorId);
    vendor.vendor_status = VendorStatus.INACTIVE;
    return this.vendorRepo.save(vendor);
  }

  // ---------------- Improved Vendor Search ----------------
 async searchVendors(query: SearchVendorDto) {

  const { ServiceType, date, service_area } = query;
  console.log(query,"query");
  
  const qb = this.vendorRepo
    .createQueryBuilder('vendor')
    .leftJoin('vendor.vendorAvailabilities', 'availability')
    .where('vendor.vendor_status = :status', { status: 'ACTIVE' });
  console.log(qb.getSql(),"getsql");
  
  if (ServiceType) {
    qb.andWhere('vendor.service_type = :serviceType', { serviceType: ServiceType, });
  }

  if (service_area) {
    qb.andWhere('vendor.service_area = :area', { area: service_area, });
  }

  if (date) {
    qb.andWhere('availability.date = :date', { date });
    qb.andWhere('availability.available_slots > 0');
    qb.andWhere('availability.availability_status = :availability', {
      availability: 'AVAILABLE',
    });
  }

  return qb.getMany();
}
  // ---------------- Availability Tracking ----------------
  async createAvailability(
    dto: CreateVendorAvailabilityDto,
  ): Promise<VendorAvailability> {
    const vendor = await this.vendorRepo.findOne({
      where: { vendor_id: String(dto.vendor_id) },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const availability = this.availabilityRepo.create({
      vendor,
      date: dto.date,
      maximum_capacity: dto.available_slots,
      available_slots: dto.available_slots,
      booked_count: 0,
      availability_status: AvailabilityStatus.AVAILABLE,
    });

    return this.availabilityRepo.save(availability);
  }

  async updateAvailability(
    id: number,
    dto: UpdateVendorAvailabilityDto,
  ): Promise<VendorAvailability> {
    return await this.dataSource.transaction(async (manager) => {
      const availability = await manager
        .getRepository(VendorAvailability)
        .createQueryBuilder('va')
        .setLock('pessimistic_write')
        .where('va.id = :id', { id })
        .getOne();

      if (!availability) throw new NotFoundException('Availability not found');

      availability.available_slots = dto.available_slots;
      availability.booked_count =
        availability.maximum_capacity - availability.available_slots;

      // Update status based on capacity
      if (availability.available_slots === 0) {
        availability.availability_status = AvailabilityStatus.FULLY_BOOKED;
      } else if (availability.available_slots < availability.maximum_capacity) {
        availability.availability_status = AvailabilityStatus.PARTIALLY_BOOKED;
      } else {
        availability.availability_status = AvailabilityStatus.AVAILABLE;
      }

      return manager.save(availability);
    });
  }

  async getAvailability(vendorId: string): Promise<VendorAvailability[]> {
    const vendor = await this.findOne(vendorId);
    return this.availabilityRepo.find({
      where: { vendor: {vendor_id:vendorId} },
      order: { date: 'ASC' },
    });
  }

  // ---------------- Concurrency-Safe Booking ----------------
  async bookVendorSlot(
    vendorId: string,
    date: string,
  ): Promise<VendorAvailability> {
    return await this.dataSource.transaction(async (manager) => {
      const availability = await manager
        .getRepository(VendorAvailability)
        .createQueryBuilder('va')
        .setLock('pessimistic_write')
        .where('va.vendor_id = :vendorId', { vendorId })
        .andWhere('va.date = :date', { date })
        .getOne();

      if (!availability)
        throw new NotFoundException('Vendor not available on this date');
      if (availability.available_slots <= 0)
        throw new BadRequestException('No slots available');

      availability.booked_count += 1;
      availability.available_slots -= 1;

      // Update status dynamically
      if (availability.available_slots === 0) {
        availability.availability_status = AvailabilityStatus.FULLY_BOOKED;
      } else if (availability.available_slots < availability.maximum_capacity) {
        availability.availability_status = AvailabilityStatus.PARTIALLY_BOOKED;
      } else {
        availability.availability_status = AvailabilityStatus.AVAILABLE;
      }

      return manager.save(availability);
    });
  }
  // ---------------- Vendor Assigned Events ----------------
  // vendors.service.ts
  async getVendorAssignments(vendorId: string): Promise<VendorAssignment[]> {
    // Find the vendor by vendor_id
    const vendor = await this.vendorRepo.findOne({
      where: { vendor_id: vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Fetch all assignments for this vendor using vendor.id (primary key)
    const assignments = await this.assignmentRepo.find({
      where: { vendor: { vendor_id: vendor.vendor_id } }, // use PK
      relations: ['event_booking'], // load event data
      order: { created_at: 'DESC' },
    });

    if (!assignments.length)
      throw new NotFoundException('No assignments found for this vendor');

    return assignments;
  }
}
