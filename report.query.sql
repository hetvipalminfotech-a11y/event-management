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
ON event_bookings(event_date, event_type);

SELECT
    eb.event_type,

    COUNT(*) AS total_bookings,

    (
        SELECT MONTH(event_date)
        FROM event_bookings eb2
        WHERE eb2.event_type = eb.event_type
        AND YEAR(eb2.event_date) = YEAR(CURDATE())
        GROUP BY MONTH(event_date)
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) AS peak_month,

    ROUND(AVG(eb.guest_count),2) AS avg_guest_count,

    ROUND(AVG(eb.total_package),2) AS avg_package_value,

    SUM(eb.total_package) AS total_revenue

FROM event_bookings eb

WHERE YEAR(eb.event_date) = YEAR(CURDATE())

GROUP BY eb.event_type

ORDER BY total_revenue DESC;

-- Report 4 Vendor Utilisation Report

-- Vendor assignment joins
-- CREATE INDEX idx_va_vendor 
-- ON vendor_assignments(vendor_id);

-- CREATE INDEX idx_va_booking 
-- ON vendor_assignments(booking_id);

-- -- Booking month filter
-- CREATE INDEX idx_booking_date 
-- ON event_bookings(event_date);

-- -- Vendor availability filtering
-- CREATE INDEX idx_vendor_availability_vendor_date
-- ON vendor_availability(vendor_id, date);

-- -- Composite index for availability
-- CREATE INDEX idx_vendor_availability_month
-- ON vendor_availability(date, vendor_id);
SELECT
    v.vendor_name,
    v.service_type,

    va.total_capacity,
    COALESCE(va2.total_bookings,0) AS total_bookings,

    va.total_capacity - COALESCE(va2.total_bookings,0) AS available_capacity_remaining,

    ROUND(
        COALESCE(va2.total_bookings,0) * 100 /
        NULLIF(va.total_capacity,0)
    ,2) AS utilisation_rate,

    COALESCE(va2.revenue_contribution,0) AS revenue_contribution

FROM vendors v

LEFT JOIN
(
    SELECT
        vendor_id,
        SUM(maximum_capacity) AS total_capacity
    FROM vendor_availability
    WHERE date >= '2026-01-01'
      AND date < '2026-02-01'
    GROUP BY vendor_id
) va ON v.vendor_id = va.vendor_id

LEFT JOIN
(
    SELECT
        va.vendor_id,
        COUNT(va.id) AS total_bookings,
        SUM(
            CASE
                WHEN va.assignment_status='COMPLETED'
                THEN va.vendor_cost_snapshot
                ELSE 0
            END
        ) AS revenue_contribution
    FROM vendor_assignments va
    JOIN event_bookings eb
        ON va.booking_id = eb.booking_id
    WHERE eb.event_date >= '2026-01-01'
      AND eb.event_date < '2026-02-01'
    GROUP BY va.vendor_id
) va2 ON v.vendor_id = va2.vendor_id

ORDER BY utilisation_rate DESC;
