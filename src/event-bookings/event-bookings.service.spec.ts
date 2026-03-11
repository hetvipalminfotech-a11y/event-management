import { Test, TestingModule } from '@nestjs/testing';
import { EventBookingsService } from './event-bookings.service';

describe('EventBookingsService', () => {
  let service: EventBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventBookingsService],
    }).compile();

    service = module.get<EventBookingsService>(EventBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
