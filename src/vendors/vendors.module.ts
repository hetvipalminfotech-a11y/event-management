import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { Vendor } from './entities/vendor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, VendorAvailability, User])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
