import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Check
} from 'typeorm';

import { Vendor } from './vendor.entity';
import { AvailabilityStatus } from 'src/common/enums/availability-status.enum';

@Entity('vendor_availability')
@Check(`available_slots >= 0`)
export class VendorAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.vendorAvailabilities)
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @Column({ type: 'date' })
  date!: Date;

  @Column()
  maximum_capacity!: number;

  // how many events already booked
  @Column({ default: 0 })
  booked_count!: number;
  
  @Column()
  available_slots!: number;  
  
  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE
  })
  availability_status!: AvailabilityStatus;

   @Column({ default: true })
      status!: boolean;
  
    @CreateDateColumn()
      created_at!: Date;
  
    @UpdateDateColumn()
      updated_at!: Date;
}