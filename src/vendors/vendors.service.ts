import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';

import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { User } from '../users/entities/user.entity';
import { VendorStatus } from '../common/enums/vendor-status.enum';
import { ServiceType } from '../common/enums/service-type.enum';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    @InjectRepository(User)
  private readonly userRepo: Repository<User>,
  ) {}

  /*
  =====================================
  Generate Vendor ID (VEN-2025-001)
  =====================================
  */
  private async generateVendorId(): Promise<string> {
    const year = new Date().getFullYear();

    const lastVendor = await this.vendorRepo
      .createQueryBuilder('vendor')
      .where('vendor.vendor_id LIKE :pattern', {
        pattern: `VEN-${year}-%`,
      })
      .orderBy('vendor.vendor_id', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastVendor) {
      const lastId = lastVendor.vendor_id;
      const lastNumber = parseInt(lastId.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `VEN-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  /*
  =====================================
  Create Vendor (Admin only)
  =====================================
  */
  async createVendor(
  dto: CreateVendorDto,
  userId: number,
): Promise<Vendor> {

  const user = await this.userRepo.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (dto.package_price <= dto.vendor_cost) {
    throw new BadRequestException(
      'Package price must be greater than vendor cost',
    );
  }

  const vendorId = await this.generateVendorId();

  const vendor = this.vendorRepo.create({
    ...dto,
    vendor_id: vendorId,
    user,
  });

  return this.vendorRepo.save(vendor);
}

  /*
  =====================================
  Get All Vendors
  =====================================
  */
  async findAll(): Promise<Vendor[]> {
    return this.vendorRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  /*
  =====================================
  Get Vendor By ID
  =====================================
  */
  async findOne(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { vendor_id: vendorId },
      relations: ['user'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  /*
  =====================================
  Search Vendors
  Event Manager can search
  =====================================
  */
  async searchVendors(
    serviceType?: ServiceType,
    area?: string,
    date?: Date,
  ): Promise<Vendor[]> {
    const query = this.vendorRepo.createQueryBuilder('vendor');

    if (serviceType) {
      query.andWhere('vendor.service_type = :serviceType', {
        serviceType,
      });
    }

    if (area) {
      query.andWhere('vendor.service_area LIKE :area', {
        area: `%${area}%`,
      });
    }

    if (date) {
    query.andWhere('availability.date = :date', { date });
    query.andWhere('availability.available_slots > 0');
  }

    query.andWhere('vendor.vendor_status = :status', {
      status: VendorStatus.ACTIVE,
    });

    return query.getMany();
  }

  /*
  =====================================
  Update Vendor
  =====================================
  */
  async updateVendor(
    vendorId: string,
    dto: UpdateVendorDto,
  ): Promise<Vendor> {
    const vendor = await this.findOne(vendorId);

    if (
      dto.package_price &&
      dto.vendor_cost &&
      dto.package_price <= dto.vendor_cost
    ) {
      throw new BadRequestException(
        'Package price must be greater than vendor cost',
      );
    }

    Object.assign(vendor, dto);

    return this.vendorRepo.save(vendor);
  }

  /*
  =====================================
  Deactivate Vendor
  =====================================
  */
  async deactivateVendor(vendorId: string): Promise<Vendor> {
    const vendor = await this.findOne(vendorId);

    vendor.vendor_status = VendorStatus.INACTIVE;

    return this.vendorRepo.save(vendor);
  }
}