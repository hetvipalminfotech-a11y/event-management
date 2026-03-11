import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { VendorAssignmentService } from './vendor-assignment.service';
import { CreateVendorAssignmentDto } from './dto/create-vendor-assignment.dto';
import { UpdateVendorAssignmentDto } from './dto/update-vendor-assignment.dto';
import { DeliveryStatus } from 'src/common/enums/delivery-status';
import type { Request } from 'express';
@Controller('vendor-assignment')
export class VendorAssignmentController {
  constructor(private readonly vendorAssignmentService: VendorAssignmentService) {}
  @Get('my-events')
  getMyEvents(@Req() req:Request){

    const vendorId = (req.user as any).vendor_id;

    return this.vendorAssignmentService.getVendorAssignments(vendorId);
  }
  @Patch(':id/status')
updateStatus(
  @Req() req:Request,
  @Param('id') id:number,
  @Body('status') status:DeliveryStatus
){

  const vendorId = (req.user as any).vendor_id;

  return this.vendorAssignmentService.updateDeliveryStatus(
    vendorId,
    id,
    status
  );
}

}
