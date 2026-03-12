import { Module } from '@nestjs/common';
import { DailyReportService } from './daily-report.service';

@Module({
  providers: [DailyReportService],
})
export class TasksModule {}