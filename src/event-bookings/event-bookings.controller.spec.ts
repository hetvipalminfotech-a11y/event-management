import { Test, TestingModule } from '@nestjs/testing';
import { EventBookingsController } from './event-bookings.controller';
import { EventBookingsService } from './event-bookings.service';

describe('EventBookingsController', () => {
  let controller: EventBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventBookingsController],
      providers: [EventBookingsService],
    }).compile();

    controller = module.get<EventBookingsController>(EventBookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
