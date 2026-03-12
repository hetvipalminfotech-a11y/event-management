import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {

constructor(private dataSource: DataSource){}

async monthlyEventSummary(year:number,month:number){

const sql = `WITH monthly_events AS (
    SELECT *
    FROM event_bookings
    WHERE YEAR(event_date) = 2025
    AND MONTH(event_date) = 1
),

summary AS (
    SELECT
        COUNT(*) AS total_events_booked,

        SUM(CASE
            WHEN event_status='COMPLETED'
            THEN 1 ELSE 0
        END) AS total_events_completed,

        SUM(CASE
            WHEN event_status='CANCELLED'
            THEN 1 ELSE 0
        END) AS total_events_cancelled,

        SUM(CASE
            WHEN event_status='COMPLETED'
            THEN total_package ELSE 0
        END) AS total_revenue,

        SUM(CASE
            WHEN event_status='COMPLETED'
            THEN total_cost ELSE 0
        END) AS total_vendor_costs
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
LEFT JOIN top_event_types t ON 1=1;`;

return this.dataSource.query(sql,[year,month]);

}

async vendorPerformance(year:number,month:number){

const sql = `SELECT
    v.vendor_name,
    v.service_type,

    COUNT(va.id) AS total_events_assigned,

    SUM(CASE
        WHEN va.assignment_status='COMPLETED'
        THEN 1 ELSE 0
    END) AS events_completed,

    SUM(CASE
        WHEN va.assignment_status IN ('CANCELLED','FAILED')
        THEN 1 ELSE 0
    END) AS events_cancelled_or_failed,

    ROUND(
        SUM(CASE
            WHEN va.assignment_status='COMPLETED'
            THEN 1 ELSE 0
        END) * 100 /
        NULLIF(COUNT(va.id),0),
        2
    ) AS completion_rate,

    SUM(CASE
        WHEN va.assignment_status='COMPLETED'
        THEN va.vendor_cost_snapshot
        ELSE 0
    END) AS total_earnings

FROM vendors v

JOIN vendor_assignments va
ON v.vendor_id = va.vendor_id

JOIN event_bookings eb
ON eb.booking_id = va.booking_id

WHERE YEAR(eb.event_date)=2025
AND MONTH(eb.event_date)=1

GROUP BY v.vendor_name,v.service_type

ORDER BY completion_rate DESC;`;

return this.dataSource.query(sql,[year,month]);

}

async eventTypeSeasonAnalysis(){

const sql = `SELECT
    event_type,

    COUNT(*) AS total_bookings,

    (
        SELECT MONTH(event_date)
        FROM event_bookings e2
        WHERE e2.event_type = e1.event_type
        GROUP BY MONTH(event_date)
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) AS peak_month,

    AVG(guest_count) AS avg_guest_count,

    AVG(total_package) AS avg_package_value,

    SUM(total_package) AS total_revenue

FROM event_bookings e1

WHERE YEAR(event_date)=YEAR(CURDATE())

GROUP BY event_type

ORDER BY total_revenue DESC;`;

return this.dataSource.query(sql);

}

async vendorUtilisation(year:number,month:number){

const sql = `SELECT
    v.vendor_name,
    v.service_type,

    COUNT(DISTINCT va2.date) * v.max_events_per_day AS total_capacity,

    COUNT(va.id) AS total_bookings,

    (COUNT(DISTINCT va2.date) * v.max_events_per_day - COUNT(va.id))
        AS available_capacity,

    ROUND(
        COUNT(va.id) * 100 /
        NULLIF((COUNT(DISTINCT va2.date) * v.max_events_per_day),0),
        2
    ) AS utilisation_rate,

    SUM(CASE
        WHEN va.assignment_status='COMPLETED'
        THEN va.vendor_cost_snapshot
        ELSE 0
    END) AS revenue_contribution

FROM vendors v

LEFT JOIN vendor_availability va2
ON v.vendor_id = va2.vendor_id

LEFT JOIN vendor_assignments va
ON v.vendor_id = va.vendor_id

LEFT JOIN event_bookings eb
ON eb.booking_id = va.booking_id
AND YEAR(eb.event_date)=2025
AND MONTH(eb.event_date)=1

GROUP BY v.vendor_name,v.service_type,v.max_events_per_day

ORDER BY utilisation_rate DESC;`;

return this.dataSource.query(sql,[year,month]);

}

}