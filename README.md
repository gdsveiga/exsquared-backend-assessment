# Vehicle Makes API

Backend service that pulls vehicle data from NHTSA, stores it in PostgreSQL, and serves it through GraphQL.

## Quick Start

```bash
docker compose up --build
```

Service runs at `http://localhost:3000/graphql`

## Local Development

**Prerequisites:** Node.js 22+, pnpm, PostgreSQL 16

```bash
# Install deps
pnpm install

# Start postgres
docker compose up db -d

# Setup database
pnpm run db:generate
pnpm run db:migrate

# Fetch data from NHTSA (takes a while, ~11k makes)
pnpm run db:seed

# Run the server
pnpm run start:dev
```

### Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exquared
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
NHTSA_BASE_URL=https://vpic.nhtsa.dot.gov/api/vehicles
```

- `DATABASE_URL` - Required. Postgres connection string.
- `PORT` - Optional, defaults to 3000.
- `NODE_ENV` - Optional, defaults to `development`. Valid values: `development`, `test`, `production`. Controls GraphQL playground visibility (disabled in production).
- `LOG_LEVEL` - Optional, defaults to `info`. Valid values: `debug`, `info`, `warn`, `error`. Controls minimum log level output.
- `NHTSA_BASE_URL` - Optional, defaults to `https://vpic.nhtsa.dot.gov/api/vehicles`. The NHTSA API base URL for fetching vehicle data.

All configuration is validated on startup. If a required variable is missing or an invalid value is provided, the service will fail to start with a clear error message.

### Build & Test

```bash
pnpm run build
pnpm run start:prod

pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

## Data Model

Two tables: `Make` and `VehicleType`.

A **Make** is a vehicle manufacturer (Toyota, Ford, etc). Each make has a `makeId` from NHTSA and a `makeName`.

A **VehicleType** belongs to a make and represents what kind of vehicles they produce (Passenger Car, Truck, Motorcycle, etc). The combination of `makeId` + `typeId` is unique.

Both tables have standard `id`, `createdAt`, `updatedAt` fields.

## GraphQL API

Endpoint: `/graphql`

Playground available in dev mode.

### Available Queries

**Makes:**
- `makes(skip, take)` - paginated list
- `make(id)` - by internal ID
- `makeByMakeId(makeId)` - by NHTSA ID
- `searchMakes(name, skip, take)` - case-insensitive search
- `makesCount` - total count

**Vehicle Types:**
- `vehicleTypes(skip, take)` - paginated list
- `vehicleType(id)` - by ID
- `vehicleTypesByMakeId(makeId)` - all types for a make
- `searchVehicleTypes(name, skip, take)` - search by name
- `vehicleTypesCount` - total count

### Example Queries

```graphql
# Get some makes with their vehicle types
query {
  makes(take: 10) {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}

# Search for a specific manufacturer
query {
  searchMakes(name: "toyota") {
    makeId
    makeName
    vehicleTypes {
      typeName
    }
  }
}

# Get types for make ID 440 (Aston Martin)
query {
  vehicleTypesByMakeId(makeId: 440) {
    typeId
    typeName
  }
}
```

---

## Architecture Notes

### Ingestion Pipeline

The seed script (`prisma/seed.ts`) handles data ingestion:

1. Fetches all makes from NHTSA's XML API
2. For each make, fetches its vehicle types
3. Parses XML with xml2js
4. Upserts to Postgres via Prisma

The process is idempotent - you can run it multiple times safely. It logs progress every 100 makes and continues past individual failures.

### Error Handling

- GraphQL queries throw `NotFoundException` when a resource isn't found
- Apollo formats errors with `code` and `statusCode` in extensions
- Ingestion catches and logs individual failures without stopping the whole process
- Config validation fails fast on startup if required env vars are missing

### Configuration

Uses `@nestjs/config` with class-validator for validation. Check `src/config/env.validation.ts` for the schema.

### Logging

All logs are JSON-formatted and written to stdout/stderr, making them easy to collect with any log aggregator (CloudWatch, Datadog, ELK, etc).

Every log entry includes a timestamp, level, message, and optional context. The logger service lives in `src/infrastructure/logger/`.

What gets logged:

- **GraphQL operations** - Every query/mutation logs its name, type, and how long it took. Errors include the stack trace.
- **Database events** - Connection established, connection errors, cleanup on shutdown.
- **Application lifecycle** - Startup confirmation, port info, graceful shutdown signals.
- **Ingestion progress** - During seeding, logs progress every 100 makes, plus any failures with details.

Unexpected errors (5xx) are logged with full context. Expected errors (4xx like "not found") are not logged to keep noise down - they just flow through to the client.

### Project Layout

```
src/
  config/           - env validation
  domain/           - business logic (make/, vehicle-type/)
  infrastructure/   - database stuff
  presentation/     - graphql resolvers and types

prisma/
  schema.prisma     - db schema
  seed.ts           - ingestion script
  migrations/       - migration files
```
