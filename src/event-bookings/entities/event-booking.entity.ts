import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EventType } from 'src/common/enums/event-type.enum';
import { EventStatus } from 'src/common/enums/event-status';
import { User } from 'src/users/entities/user.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';

@Entity('event_bookings')
export class EventBooking  {

  @PrimaryColumn()
  booking_id!: string;

  @Column()
  customer_name!: string;

  @Column()
  customer_phone!: string;

  @Column({
    type: 'enum',
    enum: EventType
  })
  event_type!: EventType;

  @Column({ type: 'date' })
  event_date!: Date;

  @Column()
  guest_count!: number;

  @Column('decimal')
  total_cost!: number;

  @Column('decimal')
  total_package!: number;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.BOOKED
  })
  event_status!: EventStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by!: User;

  @OneToMany(() => VendorAssignment, (assignment) => assignment.event_booking)
  vendor_assignments!: VendorAssignment[];

   @Column({ default: true })
      status!: boolean;
  
    @CreateDateColumn()
      created_at!: Date;
  
    @UpdateDateColumn()
      updated_at!: Date;
}