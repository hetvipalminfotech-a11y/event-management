-- Report 1 — Monthly Event Summary

WITH monthly_events AS (
    SELECT *
    FROM event_bookings
    WHERE YEAR(event_date) = 2026
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
LEFT JOIN top_event_types t ON 1=1;

-- Report 2 Vendor Performance Report
SELECT
    v.vendor_name,
    v.service_type,

    COUNT(va.id) AS total_events_assigned,

    SUM(va.assignment_status = 'COMPLETED') AS events_completed,

    SUM(va.assignment_status = 'CANCELLED') AS events_cancelled,

    ROUND(
        SUM(va.assignment_status = 'COMPLETED') * 100 /
        NULLIF(COUNT(va.id),0),
        2
    ) AS completion_rate,

    SUM(
        CASE
            WHEN va.assignment_status = 'COMPLETED'
            THEN va.vendor_cost_snapshot
            ELSE 0
        END
    ) AS total_earnings

FROM vendor_assignments va

JOIN event_bookings eb
ON eb.booking_id = va.booking_id

JOIN vendors v
ON v.vendor_id = va.vendor_id

WHERE eb.event_date >= '2026-01-01'
AND eb.event_date < '2026-02-01'

GROUP BY v.vendor_id, v.vendor_name, v.service_type

ORDER BY completion_rate DESC;

-- Report 3 Event Type & Season Analysis
WITH event_month_counts AS (
    SELECT
        event_type,
        MONTH(event_date) AS event_month,
        COUNT(*) AS monthly_bookings
    FROM event_bookings
    WHERE event_date >= '2026-01-01'
    AND event_date < '2027-01-01'
    GROUP BY event_type, MONTH(event_date)
),

peak_month AS (
    SELECT
        event_type,
        event_month,
        monthly_bookings,
        ROW_NUMBER() OVER(
            PARTITION BY event_type
            ORDER BY monthly_bookings DESC
        ) AS rn
    FROM event_month_counts
)

SELECT
    eb.event_type,

    COUNT(*) AS total_bookings,

    pm.event_month AS peak_month,

    ROUND(AVG(eb.guest_count),2) AS avg_guest_count,

    ROUND(AVG(eb.total_package),2) AS avg_package_value,

    SUM(eb.total_package) AS total_revenue

FROM event_bookings eb

JOIN peak_month pm
ON eb.event_type = pm.event_type
AND pm.rn = 1

WHERE eb.event_date >= '2026-01-01'
AND eb.event_date < '2027-01-01'

GROUP BY
    eb.event_type,
    pm.event_month

ORDER BY total_revenue DESC;

-- Report 4 Vendor Utilisation Report

    SELECT
        v.vendor_name,
        v.service_type,
    
        COUNT(DISTINCT va2.date) * v.max_events_per_day AS total_capacity,
    
        COUNT(va.id) AS total_bookings,
    
        GREATEST(
            COUNT(DISTINCT va2.date) * v.max_events_per_day - COUNT(va.id),
            0
        ) AS available_capacity,
    
        ROUND(
            COUNT(va.id) * 100.0 /
            NULLIF((COUNT(DISTINCT va2.date) * v.max_events_per_day),0),
            2
        ) AS utilisation_rate,
    
        SUM(CASE
            WHEN va.assignment_status = 'COMPLETED'
            THEN va.vendor_cost_snapshot
            ELSE 0
        END) AS revenue_contribution
    
    FROM vendors v
    
    LEFT JOIN vendor_availability va2
    ON  v.vendor_id     = va2.vendor_id
    AND YEAR(va2.date)  = '2026'
    AND MONTH(va2.date) = '01'
    
    LEFT JOIN vendor_assignments va
    ON v.vendor_id = va.vendor_id
    
    LEFT JOIN event_bookings eb
    ON  eb.booking_id        = va.booking_id
    AND YEAR(eb.event_date)  = '2026'
    AND MONTH(eb.event_date) = '01'
    
    GROUP BY v.vendor_name,v.service_type,v.max_events_per_day
    
    ORDER BY utilisation_rate DESC