import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../common/enums/delivery-status';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeliveryStatusDto {
  @ApiProperty()
  @IsEnum(DeliveryStatus)
  delivery_status!: DeliveryStatus;

}