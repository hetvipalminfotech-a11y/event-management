import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';

import { Vendor } from '../../vendors/entities/vendor.entity';
import { EventBooking } from '../../event-bookings/entities/event-booking.entity';

import { AssignmentStatus } from '../../common/enums/assignment-status.enum';
import { DeliveryStatus } from 'src/common/enums/delivery-status';

@Entity('vendor_assignments')
export class VendorAssignment  {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => EventBooking, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'booking_id' })
  event_booking!: EventBooking;

  @ManyToOne(() => Vendor, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @Column('decimal')
  vendor_cost_snapshot!: number;

  @Column('decimal')
  package_price_snapshot!: number;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE
  })
  assignment_status!: AssignmentStatus;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING
  })
  delivery_status!: DeliveryStatus;

   @Column({ default: true })
      status!: boolean;
  
    @CreateDateColumn()
      created_at!: Date;
  
    @UpdateDateColumn()
      updated_at!: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}