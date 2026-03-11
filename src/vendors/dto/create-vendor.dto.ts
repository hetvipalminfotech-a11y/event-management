  import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
  import { ServiceType } from '../../common/enums/service-type.enum';
  import { Type } from 'class-transformer';

  export class CreateVendorDto {
    @IsString()
    @IsNotEmpty()
    vendor_name!: string;

    @IsString()
    business_name!: string;

    @IsString()
    contact_number!: string;

    @IsString()
    service_area!: string;

    @IsEnum(ServiceType)
    service_type!: ServiceType;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    vendor_cost!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    package_price!: number;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    max_events_per_day!: number;

    @Type(() => Number)
    @IsNumber()
    user_id!: number;
  }
