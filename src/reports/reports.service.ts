import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {

  constructor(private dataSource: DataSource) {}

  async monthlyEventSummary(year:number,month:number){

    const sql = `
    WITH monthly_events AS (
        SELECT *
        FROM event_bookings
        WHERE YEAR(event_date) = ?
        AND MONTH(event_date) = ?
    ),

    summary AS (
        SELECT
            COUNT(*) AS total_events_booked,

            SUM(CASE WHEN event_status='Completed'
                THEN 1 ELSE 0 END) AS total_events_completed,

            SUM(CASE WHEN event_status='Cancelled'
                THEN 1 ELSE 0 END) AS total_events_cancelled,

            SUM(CASE WHEN event_status='Completed'
                THEN total_package ELSE 0 END) AS total_revenue,

            SUM(CASE WHEN event_status='Completed'
                THEN total_cost ELSE 0 END) AS total_vendor_costs

        FROM monthly_events
    ),

    top_event_types AS (
        SELECT
            event_type,
            COUNT(*) AS booking_count
        FROM monthly_events
        GROUP BY event_type
        ORDER BY booking_count DESC
        LIMIT 3
    )

    SELECT
        s.total_events_booked,
        s.total_events_completed,
        s.total_events_cancelled,
        s.total_revenue,
        s.total_vendor_costs,
        (s.total_revenue - s.total_vendor_costs) AS total_profit,
        t.event_type,
        t.booking_count
    FROM summary s
    LEFT JOIN top_event_types t ON 1=1
    `;

    return this.dataSource.query(sql,[year,month]);
  }
}