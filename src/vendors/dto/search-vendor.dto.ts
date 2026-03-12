import { ApiPropertyOptional } from "@nestjs/swagger";
import { ServiceType } from "src/common/enums/service-type.enum";

export class SearchVendorDto {

  @ApiPropertyOptional({ enum: ServiceType })
  service_type?: ServiceType;

  @ApiPropertyOptional()
  area?: string;

  @ApiPropertyOptional()
  date?: string;
}