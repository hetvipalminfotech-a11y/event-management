import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../common/enums/delivery-status';

export class UpdateDeliveryStatusDto {

  @IsEnum(DeliveryStatus)
  delivery_status!: DeliveryStatus;

}