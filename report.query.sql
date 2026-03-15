-- Report 1 — Monthly Event Summary
CREATE INDEX idx_event_report
ON event_bookings(event_date, event_status)
INCLUDE (total_package, total_cost);
SELECT
    COUNT(*) AS total_events_booked,

    SUM(CASE 
        WHEN event_status = 'COMPLETED' THEN 1 
        ELSE 0 
    END) AS total_events_completed,

    SUM(CASE 
        WHEN event_status = 'CANCELLED' THEN 1 
        ELSE 0 
    END) AS total_events_cancelled,

    SUM(CASE 
        WHEN event_status = 'COMPLETED' 
        THEN total_package 
        ELSE 0 
    END) AS total_revenue,

    SUM(CASE 
        WHEN event_status = 'COMPLETED' 
        THEN total_cost 
        ELSE 0 
    END) AS total_vendor_costs,

    SUM(CASE 
        WHEN event_status = 'COMPLETED' 
        THEN (total_package - total_cost)
        ELSE 0 
    END) AS total_profit

FROM event_bookings

WHERE event_date >= '2026-01-01'
AND event_date < '2026-01-31';

SELECT
    event_type,
    COUNT(*) AS booking_count
FROM event_bookings

WHERE event_date >= '2026-01-01'
AND event_date < '2026-01-31'

GROUP BY event_type
ORDER BY booking_count DESC
LIMIT 3;

-- Report 2 Vendor Performance Report
CREATE INDEX idx_event_date
ON event_bookings(event_date);

CREATE INDEX idx_va_booking
ON vendor_assignments(booking_id);

CREATE INDEX idx_va_vendor
ON vendor_assignments(vendor_id);

CREATE INDEX idx_va_status
ON vendor_assignments(assignment_status);
SELECT
    v.vendor_name,
    v.service_type,

    COUNT(va.id) AS total_events_assigned,

    SUM(CASE 
        WHEN va.assignment_status = 'COMPLETED'
        THEN 1 ELSE 0
    END) AS events_completed,

    SUM(CASE 
        WHEN va.assignment_status IN ('CANCELLED','FAILED')
        THEN 1 ELSE 0
    END) AS events_cancelled_or_failed,

    ROUND(
        SUM(CASE 
            WHEN va.assignment_status = 'COMPLETED'
            THEN 1 ELSE 0
        END) * 100 /
        NULLIF(COUNT(va.id),0)
    ,2) AS completion_rate_percentage,

    SUM(CASE
        WHEN va.assignment_status = 'COMPLETED'
        THEN va.vendor_cost_snapshot
        ELSE 0
    END) AS total_earnings

FROM vendors v

JOIN vendor_assignments va
    ON v.vendor_id = va.vendor_id

JOIN event_bookings eb
    ON va.booking_id = eb.booking_id

WHERE eb.event_date >= '2026-01-01'
AND eb.event_date < '2026-01-31'

GROUP BY
    v.vendor_id,
    v.vendor_name,
    v.service_type

ORDER BY
    completion_rate_percentage DESC;

-- Report 3 Event Type & Season Analysis
CREATE INDEX idx_event_type_date
ON event_bookings(event_type, event_date);

CREATE INDEX idx_event_date1
ON event_bookings(event_date);
SELECT
    v.vendor_name,
    v.service_type,

    COUNT(va.id) AS total_events_assigned,

    SUM(CASE 
        WHEN va.assignment_status = 'COMPLETED'
        THEN 1 ELSE 0
    END) AS events_completed,

    SUM(CASE 
        WHEN va.assignment_status IN ('CANCELLED','FAILED')
        THEN 1 ELSE 0
    END) AS events_cancelled_or_failed,

    ROUND(
        SUM(CASE 
            WHEN va.assignment_status = 'COMPLETED'
            THEN 1 ELSE 0
        END) * 100.0 /
        NULLIF(COUNT(va.id),0)
    ,2) AS completion_rate_percentage,

    SUM(CASE
        WHEN va.assignment_status = 'COMPLETED'
        THEN va.vendor_cost_snapshot
        ELSE 0
    END) AS total_earnings

FROM event_bookings eb

JOIN vendor_assignments va
    ON eb.booking_id = va.booking_id

JOIN vendors v
    ON va.vendor_id = v.vendor_id

WHERE eb.event_date >= '2026-01-01'
AND eb.event_date < '2026-02-01'

GROUP BY
    v.vendor_id,
    v.vendor_name,
    v.service_type

ORDER BY completion_rate_percentage DESC;
-- Report 4 Vendor Utilisation Report

-- Vendor assignment joins
CREATE INDEX idx_va_vendor 
ON vendor_assignments(vendor_id);

CREATE INDEX idx_va_booking 
ON vendor_assignments(booking_id);

-- Booking month filter
CREATE INDEX idx_booking_date 
ON event_bookings(event_date);

-- Vendor availability filtering
CREATE INDEX idx_vendor_availability_vendor_date
ON vendor_availability(vendor_id, date);

-- Composite index for availability
CREATE INDEX idx_vendor_availability_month
ON vendor_availability(date, vendor_id);

   SELECT
    v.vendor_name,
    v.service_type,

    -- total capacity for month
    SUM(va.maximum_capacity) AS total_capacity,

    -- total bookings
    COUNT(va2.id) AS total_bookings,

    -- remaining capacity
    SUM(va.maximum_capacity) - COUNT(va2.id) AS available_capacity_remaining,

    -- utilisation rate
    ROUND(
        COUNT(va2.id) * 100 /
        NULLIF(SUM(va.maximum_capacity),0)
    ,2) AS utilisation_rate,

    -- revenue contribution
    SUM(
        CASE
            WHEN va2.assignment_status = 'COMPLETED'
            THEN va2.vendor_cost_snapshot
            ELSE 0
        END
    ) AS revenue_contribution

FROM vendors v

LEFT JOIN vendor_availability va
    ON v.vendor_id = va.vendor_id
    AND va.date >= '2026-01-01'
    AND va.date < '2026-01-31'

LEFT JOIN vendor_assignments va2
    ON v.vendor_id = va2.vendor_id

LEFT JOIN event_bookings eb
    ON va2.booking_id = eb.booking_id
    AND eb.event_date >= '2026-01-01'
    AND eb.event_date < '2026-01-31'

GROUP BY
    v.vendor_id,
    v.vendor_name,
    v.service_type

ORDER BY utilisation_rate DESC;