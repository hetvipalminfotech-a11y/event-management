  import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
  import { ServiceType } from '../../common/enums/service-type.enum';
  import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

  export class CreateVendorDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vendor_name!: string;

    @ApiProperty()
    @IsString()
    business_name!: string;

    @ApiProperty()
    @IsString()
    contact_number!: string;

    @ApiProperty()
    @IsString()
    service_area!: string;

    @ApiProperty()
    @IsEnum(ServiceType)
    service_type!: ServiceType;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    vendor_cost!: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    package_price!: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    max_events_per_day!: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    user_id!: number;
  }
