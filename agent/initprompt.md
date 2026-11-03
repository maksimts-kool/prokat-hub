# Rendisüsteem — Rental Management System

## Project overview

Build a **rental company management system** for items such as bicycles, electronics, camping equipment, or tools. The rental category is selected by the student and approved by the teacher as part of the school project.

Customers can browse rentable items, see which items are available for their selected dates, and make reservations. The system calculates rental costs, deposits, discounts for longer rentals, and penalties for late returns. Staff can issue and receive rented items, while administrators manage the catalogue and view rental reports.

The application is **one responsive website** for desktop, tablet, and mobile browsers. **Do not build a separate mobile app.**

## Main features
- Item catalogue with categories, search, filters, sorting, and pagination.
- Rental bookings with start/end dates and no overlapping bookings for the same item (return HTTP 409 on conflicts).
- Availability by date range.
- Rental quotes: daily price, longer-rental discounts, and deposit.
- Rental statuses: booked, issued, returned, and overdue.
- Automatic hourly overdue detection and late-fee calculations.
- Report of most popular rental items.
- Real-time availability updates after booking changes.

## Technical requirements
- Responsive React web client that communicates only with an ASP.NET Core Web API.
- Roles: Admin, Staff, Customer, Service. JWT authentication and role authorization.
- REST API with proper HTTP status codes, DTOs, CORS, Swagger/OpenAPI, and ProblemDetails.
- Required endpoints: `GET /api/items`, `GET /api/rentals/quote`, `POST /api/rentals`, `PATCH /api/rentals/{id}/status`, `GET /api/rentals/overdue`, `POST /api/rentals/{id}/mark-late`.
- At least five related database tables, EF Core migrations, and seed data.
- Business logic in services, Repository pattern, dependency injection, and client/server validation.
- Separate .NET Worker Service running hourly. It authenticates with a Service account and calls the API through HttpClient; it must not access DbContext directly.
- SignalR/WebSocket endpoint `/ws/availability` requiring JWT (access_token for the WebSocket connection). Broadcast `AvailabilityChanged { itemId, from, to }` after saving changes.
- At least eight unit tests, including two with mocks; API request tests in `.http` or Postman.
- GitHub repository and Project with at least 20 labeled issues, deadlines, daily commits, English README, and Estonian documentation.

## Stack
Use `TECH_STACK.md` as a **suggestion only**. Technologies may be replaced, added, or removed when a better or simpler option exists.

## Scope
Build and maintain **a single responsive website**. Do not add unnecessary infrastructure or features.
