import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateVendorAvailabilityDto } from './dto/create-vendor-availability.dto';
import { UpdateVendorAvailabilityDto } from './dto/update-vendor-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ServiceType } from '../common/enums/service-type.enum';
import type { RequestWithUser } from 'src/auth/auth.controller';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchVendorDto } from './dto/search-vendor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard,RolesGuard)
export class VendorsController {
  constructor(
   @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    private readonly vendorsService: VendorsService) {}

    
  // ---------------- Vendor Search ----------------
@Get('search')
@Roles(UserRole.EVENT_MANAGER)
searchVendors(@Query() query: SearchVendorDto) {
  console.log(query,"outside query");
  return this.vendorsService.searchVendors(query);
}

  // ---------------- Vendor CRUD ----------------
  @Post()
  @Roles(UserRole.ADMIN)
  createVendor(@Body() dto: CreateVendorDto, @Req() req: RequestWithUser) {
    return this.vendorsService.createVendor(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':vendor_id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.VENDOR)
  findOne(@Param('vendor_id') vendorId: string) {
    return this.vendorsService.findOne(vendorId);
  }

  @Patch(':vendor_id')
  @Roles(UserRole.ADMIN)
  updateVendor(@Param('vendor_id') vendorId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.updateVendor(vendorId, dto);
  }

  @Patch(':vendor_id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateVendor(@Param('vendor_id') vendorId: string) {
    return this.vendorsService.deactivateVendor(vendorId);
  }


  // ---------------- Availability Tracking ----------------
  @Post('availability')
  @Roles(UserRole.ADMIN)
  createAvailability(@Body() dto: CreateVendorAvailabilityDto) {
    return this.vendorsService.createAvailability(dto);
  }

  @Patch('availability/:id')
  @Roles(UserRole.ADMIN)
  updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorAvailabilityDto,
  ) {
    return this.vendorsService.updateAvailability(id, dto);
  }

  @Get(':vendor_id/availability')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.VENDOR)
  getAvailability(@Param('vendor_id') vendorId: string) {
    return this.vendorsService.getAvailability(vendorId);
  }

  // ---------------- Concurrency-Safe Booking ----------------
  @Post(':vendor_id/book')
  @Roles(UserRole.EVENT_MANAGER)
  bookSlot(@Param('vendor_id') vendorId: string, @Query('date') date: string) {
    return this.vendorsService.bookVendorSlot(vendorId, date);
  }

  // ---------------- Vendor Assigned Events ----------------
  // Only vendor can see their own assignments
 @Get(':vendor_id/assignments')
@Roles(UserRole.VENDOR)
async getVendorAssignments(
  @Param('vendor_id') vendorId: string,
  @Req() req: RequestWithUser,
) {
  // Load vendor including the user reference
  const vendor = await this.vendorRepo.findOne({
    where: { vendor_id: vendorId },
    relations: ['user'], // load the owner user
  });

  if (!vendor) throw new NotFoundException('Vendor not found');

  // Check if logged-in vendor user matches this vendor's owner
  if (req.user.role !== UserRole.VENDOR || req.user.id !== vendor.user.id) {
    throw new BadRequestException('You can only view your own assignments');
  }

  // Return the assignments
  return this.vendorsService.getVendorAssignments(vendorId);
}
}