import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EventStatus } from 'src/common/enums/event-status';

export class UpdateEventStatusDto {
    @ApiProperty()
  @IsEnum(EventStatus)
  status!: EventStatus;

}