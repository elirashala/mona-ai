# Backend

See the [root README](../README.md) for setup, validation rules, and examples.
Use Node.js 24 and PostgreSQL on localhost:5434.

Controllers expose CSV import, latest results, and inclusive date-range site reports with
CSV download. Services orchestrate repositories; PrismaService owns the database
connection. Pure parsing/validation/export utilities have Vitest tests.
Prisma schema and additive migrations stay in `prisma/`.

`npm --prefix backend test` runs the pure tests. `run test:integration` builds and
exercises the real API/database with all test writes rolled back. No database
reset or `db push` is required. Use `run start:dev` to serve port 3001.

Reports accept startDate/endDate query parameters, defaulting to the previous
calendar month. JSON and CSV use the same range. There is no seed or startup
CSV import; the database was cleared once for the user to retest manually.
