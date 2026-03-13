# Event Management System

A RESTful API built with **NestJS**, **TypeORM**, and **MySQL** for managing events, vendors, bookings, and delivery assignments. Includes JWT authentication, role-based access control, audit logging, and scheduled daily reports.

---

## database schema diagram link :- https://dbdiagram.io/d/69b3f7fcfb2db18e3b72205f

## Project Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- MySQL 8+ running locally or remotely
- A database named `event_management` created in MySQL

### 1. Clone and install dependencies

```bash
git clone https://github.com/hetvipalminfotech-a11y/event-management.git
cd event-management
npm install
```

### 2. Create the database

```sql
CREATE DATABASE event_management;
```

### 3. Configure environment variables

Copy the example below into a `.env` file at the project root (see [Environment Variables](#environment-variables) for full details).

### 4. Run database migrations / sync

TypeORM is configured with `synchronize: true` in development, so tables are auto-created on first run. For production, disable `synchronize` and use migrations.

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# ── Database ──────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=Root@123
DB_NAME=event_management

# ── JWT ───────────────────────────────────────────────
JWT_ACCESS_SECRET=access_secret_key
JWT_REFRESH_SECRET=refresh_secret_key

# Access token expiry in seconds (3600 = 1 hour)
JWT_ACCESS_EXPIRES=3600

# Refresh token expiry in seconds (604800 = 7 days)
JWT_REFRESH_EXPIRES=604800
```

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `Root@123` |
| `DB_NAME` | Database name | `event_management` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | any strong string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | any strong string |
| `JWT_ACCESS_EXPIRES` | Access token TTL (seconds) | `3600` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL (seconds) | `604800` |

> **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## Running the App

```bash
# Development (watch mode)
npm run start:dev

# Development (single run)
npm run start

# Production
npm run build
npm run start:prod
```

The server starts on port `3000` by default (override with a `PORT` env variable).

---

## Seeding the Database

Run the seed script to populate the database with sample users, vendors, availability slots, bookings, and assignments:

```bash
npm run seed
```

> The seed script is idempotent — it checks whether any users exist first. If the database is already seeded, it exits safely without duplicating data.

**Seed creates:**
- Users with roles: `ADMIN`, `EVENT_MANAGER`, `VENDOR`
- Vendors across service types: `CATERING`, `DECORATION`, `PHOTOGRAPHY`, `DJ`, `MAKEUP`, `VENUE`
- Vendor availability records with slot counts
- Sample event bookings
- Vendor assignments linked to bookings

Default seeded password for all users: **`password123`**

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api
```

All protected routes require a Bearer token in the `Authorization` header.

---

## Modules Overview

| Module | Responsibility |
|---|---|
| **Auth** | Register, login, refresh access token |
| **Users** | User CRUD, role management |
| **Vendors** | Vendor CRUD, availability management, search by date/service/area |
| **Event Bookings** | Create, view, cancel, and status-update bookings |
| **Vendor Assignment** | Assign vendors to events, track delivery pipeline |
| **Reports** | Monthly and custom event/revenue reports |
| **Audit** | Auto-logs all entity changes (who, what, when) via TypeORM subscriber |
| **Task** | Scheduled cron job for daily reports |

### Roles

| Role | Permissions |
|---|---|
| `ADMIN` | Full access — users, vendors, bookings, assignments, reports |
| `EVENT_MANAGER` | Create and manage bookings, view assignments, complete events |
| `VENDOR` | View own assignments, update delivery status |

### Delivery Status Flow (Vendor Pipeline)

```
PENDING → ARRANGED → DELIVERED → DONE
```

Any status can transition to `CANCELLED`. Transitions outside this sequence are rejected.

### Event Status Flow

```
BOOKED → COMPLETED
BOOKED → CANCELLED
```

An event can only be marked `COMPLETED` once all vendor assignments have reached `DONE`. A cancelled or completed event cannot be updated further.

---

## How Booking + Vendor Availability Works (Transaction)

When a booking is created, the entire operation runs inside a **single TypeORM `QueryRunner` transaction** to guarantee atomicity. Either everything succeeds and commits, or everything rolls back on any error.

### Steps inside the transaction (`EventBookingsService.create`)

1. **Generate booking ID** — a sequential ID in the format `EVENT-{year}-{seq}` (e.g. `EVENT-2026-001`) is generated before the transaction by querying the latest booking ID for the current year.

2. **Validate vendors** — all requested `vendor_ids` are fetched. The transaction throws immediately if:
   - Any vendor ID does not exist.
   - Any vendor has `vendor_status = INACTIVE`.
   - Any vendor has `package_price <= vendor_cost` (invalid pricing configuration).

3. **Check and lock availability** — for each vendor, the availability row for `event_date` is fetched using a **`pessimistic_write` lock** (`SELECT ... FOR UPDATE`). If any vendor has no availability record for that date, or `available_slots <= 0`, the booking is rejected with a `ConflictException` listing the unavailable vendors.

4. **Compute totals** — `total_cost` and `total_package` are summed server-side from the fetched vendor records (see [next section](#how-total_cost-and-total_package-are-computed)).

5. **Save booking** — the `EventBooking` record is created with `event_status = BOOKED`.

6. **Create vendor assignments** — a `VendorAssignment` row is created for each vendor, with `vendor_cost_snapshot` and `package_price_snapshot` capturing the prices at booking time (price snapshots protect the booking record from future vendor price changes).

7. **Reduce available slots** — for each vendor's availability record, `available_slots -= 1` and `booked_count = maximum_capacity - available_slots`.

8. **Commit or rollback** — on success the transaction commits. On any exception the `catch` block calls `rollbackTransaction()`, and the error is rethrown. The `finally` block always releases the query runner.

### Cancellation also uses a transaction

`cancelBooking` opens its own `QueryRunner` transaction. It restores each vendor's `available_slots += 1`, sets all assignments to `DeliveryStatus.CANCELLED`, and sets the booking to `EventStatus.CANCELLED` — all in one atomic operation.

---

## How Concurrent Vendor Capacity Reduction Is Handled

The system prevents double-booking under concurrent requests using **pessimistic write locking** at the database level.

### Where the lock is applied

During booking creation, each vendor's availability row is fetched inside the active transaction with:

```typescript
await queryRunner.manager
  .getRepository(VendorAvailability)
  .createQueryBuilder('availability')
  .leftJoinAndSelect('availability.vendor', 'vendor')
  .setLock('pessimistic_write')           // → SELECT ... FOR UPDATE
  .where('vendor.vendor_id = :vendorId', { vendorId: vendor.vendor_id })
  .andWhere('DATE(availability.date) = :eventDate', { eventDate: dto.event_date })
  .getOne();
```

`.setLock('pessimistic_write')` translates to a `SELECT ... FOR UPDATE` SQL statement. MySQL holds an exclusive row lock on the matched `vendor_availability` row for the duration of the transaction.

### Why this prevents race conditions

If two booking requests arrive simultaneously for the same vendor on the same date:

- **Request A** acquires the `FOR UPDATE` lock on the availability row and reads `available_slots = 1`.
- **Request B** attempts to acquire the same lock and is **blocked** by MySQL until Request A's transaction commits or rolls back.
- Request A decrements the slot, commits, and releases the lock.
- Request B now acquires the lock, reads the updated `available_slots = 0`, and receives a `ConflictException` — no double-booking occurs.

This avoids the "lost update" anomaly that would happen with a plain `SELECT` + `UPDATE` approach without locking.

### Additional safeguard in `VendorAvailability` entity

The entity has a database-level `CHECK` constraint:

```typescript
@Check(`available_slots >= 0`)
```

This acts as a final safety net — even if application logic were bypassed, the database would reject any update that pushed `available_slots` below zero.

### The same pattern in `updateAvailability` and `bookVendorSlot`

Both methods in `VendorsService` also wrap their slot mutations in `this.dataSource.transaction(...)` with `.setLock('pessimistic_write')`, applying the same concurrency protection for direct availability updates.

---

## How `total_cost` and `total_package` Are Computed

Both fields are **computed entirely server-side** during booking creation and are never accepted from the client request body.

### Source of values

Each vendor entity has two price fields:

| Field | Description |
|---|---|
| `vendor_cost` | The internal cost Anthropic pays the vendor (hidden from clients via `@Exclude()`) |
| `package_price` | The price charged to the customer |

The `Vendor` entity enforces at the database level that `package_price > vendor_cost` via a `@Check` constraint.

### Calculation logic

```typescript
let totalCost = 0;
let totalPackage = 0;

vendors.forEach((vendor) => {
  totalCost    += Number(vendor.vendor_cost);
  totalPackage += Number(vendor.package_price);
});
```

`total_cost` is the sum of all `vendor_cost` values across selected vendors — the internal cost of running the event.

`total_package` is the sum of all `package_price` values — the total amount billed to the customer.

The difference (`total_package - total_cost`) represents the platform's margin.

### Price snapshots on assignments

In addition to storing the totals on the booking, each `VendorAssignment` row captures:

```typescript
vendor_cost_snapshot: vendor.vendor_cost,
package_price_snapshot: vendor.package_price,
```

These snapshots preserve the prices that were active at the time of booking. If a vendor's pricing is updated later, the original booking totals and per-vendor figures remain historically accurate.

### Why client-supplied totals are rejected

The `CreateEventBookingDto` does not include `total_cost` or `total_package` fields. The `ValidationPipe` is configured with `whitelist: true` and `forbidNonWhitelisted: true`, which means any attempt to pass these values from the client is automatically stripped and rejected.