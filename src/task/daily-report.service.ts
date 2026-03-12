import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
@Injectable()
export class DailyReportService {

  private readonly logger = new Logger(DailyReportService.name);

  constructor(private dataSource: DataSource) {}

  // Runs every day at 11:30 PM
  @Cron('0 30 23 * * *')
  async generateDailyEventReport() {

    this.logger.log('Running Daily Event Report...');

    const query = `
      SELECT
        COUNT(*) AS total_bookings,

        SUM(total_package) AS total_package_revenue,

        SUM(total_cost) AS total_vendor_costs,

        (SUM(total_package) - SUM(total_cost)) AS total_profit,

        GROUP_CONCAT(DISTINCT event_type) AS event_types

      FROM event_bookings

      WHERE DATE(created_at) = CURDATE()
    `;

    const result = await this.dataSource.query(query);

    this.logger.log('Daily Event Report Generated');
    this.logger.log(JSON.stringify(result));
  }
}