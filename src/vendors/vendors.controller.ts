import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard'; 

import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

import { ServiceType } from '../common/enums/service-type.enum';
import type { RequestWithUser } from 'src/auth/auth.controller'; 

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /*
  =====================================
  Create Vendor (Admin only)
  =====================================
  */
  @Post()
  @Roles(UserRole.ADMIN)
  createVendor(
    @Body() dto: CreateVendorDto,
    @Req() req: RequestWithUser,
  ) {
    return this.vendorsService.createVendor(dto, req.user.id);
  }

  /*
  =====================================
  Get All Vendors
  =====================================
  */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  findAll() {
    return this.vendorsService.findAll();
  }

  /*
  =====================================
  Search Vendors
  =====================================
  */
  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  search(
    @Query('service_type') serviceType?: ServiceType,
    @Query('area') area?: string,
    @Query('date') date?: Date
  ) {
    return this.vendorsService.searchVendors(serviceType, area);
  }

  /*
  =====================================
  Get Vendor By ID
  =====================================
  */
  @Get(':vendor_id')
  findOne(@Param('vendor_id') vendorId: string) {
    return this.vendorsService.findOne(vendorId);
  }

  /*
  =====================================
  Update Vendor
  =====================================
  */
  @Patch(':vendor_id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('vendor_id') vendorId: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.updateVendor(vendorId, dto);
  }

  /*
  =====================================
  Deactivate Vendor
  =====================================
  */
  @Patch(':vendor_id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('vendor_id') vendorId: string) {
    return this.vendorsService.deactivateVendor(vendorId);
  }
}