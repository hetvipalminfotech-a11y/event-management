import { Exclude } from 'class-transformer';
import { ServiceType } from 'src/common/enums/service-type.enum';
import { VendorStatus } from 'src/common/enums/vendor-status.enum';
import { User } from 'src/users/entities/user.entity';
import { VendorAssignment } from 'src/vendor-assignment/entities/vendor-assignment.entity';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, Check, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VendorAvailability } from './vendor-availability.entity';
@Entity('vendors')
@Check(`package_price > vendor_cost`)
export class Vendor{
    @PrimaryColumn()
    vendor_id!: string;

    @Column()
    vendor_name!: string;

    @Column()
    business_name!: string;

    @Column()
    contact_number!: string;

    @Column()
    service_area!: string;

    @Column({
        type: 'enum',
        enum: ServiceType
    })
    service_type!: ServiceType;

    @Exclude()
    @Column('decimal', { precision: 10, scale: 2 })
    vendor_cost!: number;

    @Column('decimal', { precision: 10, scale: 2 })
    package_price!: number;

    @Column()
    max_events_per_day!: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    rating!: number;

    @Column({
        type: 'enum',
        enum: VendorStatus,
        default: VendorStatus.ACTIVE
    })
    vendor_status!: VendorStatus

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User; 

    @OneToMany(
      () => VendorAvailability,
      (availability) => availability.vendor,
    )
    vendorAvailabilities!: VendorAvailability[];

    @OneToMany(() => VendorAssignment, (assignment) => assignment.vendor, {
      cascade: false,
    })
    assignments!: VendorAssignment[];

    
    
      @CreateDateColumn()
        created_at!: Date;
    
      @UpdateDateColumn()
        updated_at!: Date;
}
