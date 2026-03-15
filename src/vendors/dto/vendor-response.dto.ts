import { Expose } from "class-transformer";
import { ServiceType } from "src/common/enums/service-type.enum";
import { VendorStatus } from "src/common/enums/vendor-status.enum";

export class VendorResponseDto {

  vendor_id!: string;
  vendor_name!: string;
  business_name!: string;
  contact_number!: string;
  service_area!: string;
  service_type!: ServiceType;
  @Expose({ groups: ['admin'] })
  vendor_cost!: number;
  package_price!: number;
  max_events_per_day!: number;
  rating!: number;
  vendor_status!: VendorStatus;

}