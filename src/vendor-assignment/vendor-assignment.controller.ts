import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  Body,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';

import { VendorAssignmentsService } from './vendor-assignment.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { UserRole } from '../common/enums/user-role.enum';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@ApiBearerAuth()
@Controller('vendor-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorAssignmentsController {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    private readonly assignmentService: VendorAssignmentsService,
  ) {}

  // Vendor view their events
  @Get('my-events')
  @Roles(UserRole.VENDOR)
  async getMyEvents(@Req() req: Request) {
    const userId = (req.user as any).id;

    const vendor = await this.vendorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.assignmentService.getVendorAssignments(vendor.vendor_id);
  }

  // Vendor update delivery status
  @Patch(':id/delivery-status')
  @Roles(UserRole.VENDOR)
  async updateDeliveryStatus(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const userId = (req.user as any).id;

    const vendor = await this.vendorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.assignmentService.updateDeliveryStatus(
      vendor.vendor_id,
      id,
      dto.delivery_status,
    );
  }

  // Event Manager view event assignments
  @Get('event/:bookingId')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  getAssignmentsByEvent(@Param('bookingId') bookingId: string) {
    return this.assignmentService.getAssignmentsByEvent(bookingId);
  }

  // Get single assignment
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  getAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.getAssignmentById(id);
  }

  // Cancel assignment
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  cancelAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.cancelAssignment(id);
  }

  // Complete event
  @Patch('event/:bookingId/complete')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  completeEvent(@Param('bookingId') bookingId: string) {
    return this.assignmentService.completeEvent(bookingId);
  }

  // Delete assignment
  @Patch(':id/cancel/assignment')
  @Roles(UserRole.ADMIN)
  deleteAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.deleteAssignment(id);
  }
}
