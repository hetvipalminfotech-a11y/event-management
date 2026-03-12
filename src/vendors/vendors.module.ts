import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { Vendor } from './entities/vendor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, VendorAvailability, User, VendorAssignment])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
