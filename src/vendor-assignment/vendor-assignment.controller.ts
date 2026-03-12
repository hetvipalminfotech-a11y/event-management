import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  Body,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';

import { VendorAssignmentsService } from './vendor-assignment.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';

import { Roles } from '../common/decorators/roles.decorator';

import { UserRole } from '../common/enums/user-role.enum';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

import type { Request } from 'express';

@Controller('vendor-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorAssignmentsController {

  constructor(
    private readonly assignmentService: VendorAssignmentsService
  ) {}

  // Vendor view their events
  @Get('my-events')
  @Roles(UserRole.VENDOR)
  getMyEvents(@Req() req: Request) {

    const vendorId = (req.user as { vendor_id: string }).vendor_id;

    return this.assignmentService.getVendorAssignments(vendorId);
  }


  // Vendor update delivery status
  @Patch(':id/delivery-status')
  @Roles(UserRole.VENDOR)
  updateDeliveryStatus(

    @Req() req: Request,

    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateDeliveryStatusDto

  ) {

    const vendorId = (req.user as { vendor_id: string }).vendor_id;

    return this.assignmentService.updateDeliveryStatus(
      vendorId,
      id,
      dto.delivery_status
    );
  }


  // Event Manager view event assignments
  @Get('event/:bookingId')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  getAssignmentsByEvent(
    @Param('bookingId') bookingId: string
  ) {

    return this.assignmentService.getAssignmentsByEvent(
      bookingId
    );
  }


  // Get single assignment
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  getAssignment(
    @Param('id', ParseIntPipe) id: number
  ) {

    return this.assignmentService.getAssignmentById(id);
  }


  // Cancel assignment
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  cancelAssignment(
    @Param('id', ParseIntPipe) id: number
  ) {

    return this.assignmentService.cancelAssignment(id);
  }


  // Complete event
  @Patch('event/:bookingId/complete')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  completeEvent(
    @Param('bookingId') bookingId: string
  ) {

    return this.assignmentService.completeEvent(bookingId);
  }


  // Delete assignment
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deleteAssignment(
    @Param('id', ParseIntPipe) id: number
  ) {

    return this.assignmentService.deleteAssignment(id);
  }

}