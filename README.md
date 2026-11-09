# Mona AI — CSV imports and date-range reports

A small React + TypeScript / NestJS app with PostgreSQL 17 and Prisma 7.
It imports the supplied legacy CSV, explains invalid rows, prevents duplicate
requests, and reports counts and CHF totals for all four sites in any date range.
`sample-data/spec.md` and the original CSV are unchanged.

## Run locally

Prerequisites: Node.js 24.15+ and Docker with Compose v2.
From the repository root:

```sh
docker compose -p mona-requests -f database/docker-compose.yml up -d
npm --prefix backend ci
cp -n backend/.env.example backend/.env
npm --prefix backend run prisma:deploy
npm --prefix backend run start:dev
```

In another terminal:

```sh
npm --prefix frontend ci
cp -n frontend/.env.example frontend/.env
npm --prefix frontend run dev
```

Open **http://localhost:5173**. The API defaults to **http://localhost:3001**.
If an older dev server is running, stop it in its terminal before restarting.
The frontend uses `VITE_API_URL` (API origin, without `/api`); restart Vite after
changing it. Preview also uses port 5173 to match the API's CORS allowlist.

PostgreSQL binds only to `127.0.0.1:5434`; the database is `mona_requests`, user
`mona_user`, password `mona_dev_password` (development only). The named volume
persists data. Stop with `docker compose -p mona-requests -f database/docker-compose.yml down`
without `--volumes`. Real `.env` files and generated files are ignored by Git.

## Use

The workspace has two tabs. Each loads only the data it needs:

1. **Import CSV:** select `sample-data/requests_2026-03.csv`, click **Import requests**,
   and review row counts, errors, and original values. The latest result survives
   reload. Importing the file again creates no duplicate request records.
2. **Reports:** last calendar month is selected initially. Shortcuts on the left
   include Today, Yesterday, Last 7 days, Last week, This month, and Last month.
   Last week means the previous Monday–Sunday; This month means month-to-date.
   Use the From/To calendar inputs and **Apply dates** for any custom range.
3. Both endpoints are inclusive calendar dates; report and **Download CSV** use
   exactly the same applied range. The CSV contains four site rows, not individual
   requests. Zero-data sites remain visible.
4. For the assignment's March figures choose **01.03.2026–31.03.2026**. The default
   previous month is relative to today and will normally contain no fixture data.

**Delete all data**, on the right of the tabs, asks for confirmation before
permanently removing all requests, upload results, and row outcomes from
PostgreSQL across every date range. Reports are computed from requests, so they
become empty too. The schema, migrations, and Docker volume are preserved.
Import/delete actions are blocked from overlapping in the UI and use the same
transaction lock on the server. Success clears the displayed import results and
refreshes reports; an error leaves the current view available for retry.

The Import and Reports tabs mount independently. React Strict Mode remains on;
initial reads are deferred until its first cleanup has run, so development setup
replay does not issue an immediately-cancelled duplicate fetch. Obsolete requests
are still aborted when genuinely navigating away or changing dates.

On an empty database: **121 rows → 112 imported, 6 invalid, 3 duplicates**.
The report includes **96** unique requests reported in March; valid February and
April requests remain stored but do not belong to the March report.

| March 2026 site | Requests | CHF total |
| --- | ---: | ---: |
| Zürich-Oerlikon | 31 | 48'375.90 |
| Genève-Plainpalais | 19 | 35'889.90 |
| Basel-St. Johann | 26 | 33'209.85 |
| Lugano-Centro | 20 | 30'183.65 |
| **All sites** | **96** | **147'659.30** |

Zürich and Genève match the client's independent control figures. Report values
come from database aggregation, not hardcoded UI totals. Sites with no records
still appear with zero counts and amounts.

## Persistence and deduplication

There is **no seed script and no startup import**. `prisma:deploy` applies schema
migrations; `prisma:generate` generates TypeScript. Neither inserts requests.
Only a successful CSV upload writes application data to PostgreSQL. The named
Docker volume preserves it when the app or containers restart.

- `Request` holds valid requests; its canonical `requestId` is the primary key.
- `ImportBatch` stores upload counts; `ImportRow` stores row outcomes, reasons,
  and original decoded values, including rejected rows. These are audit results,
  not invalid processed requests.
- In one transaction, import writers lock the Request table, fetch existing IDs,
  and validate/deduplicate rows using a set. IDs are trimmed/uppercased. Only
  unseen valid rows are inserted. The DB primary key backs this up. Transactions
  serialize competing uploads; the first valid record wins and isn't overwritten.
- Reimporting the fixture creates another import result, but **0 new requests**:
  115 duplicate rows and the same 6 invalid rows. Within a first import there are
  3 duplicates, because the file itself repeats IDs.

The development tables were cleared once at the user's request for a fresh
manual retest, after a private local backup. Schema, migrations, and Docker data
configuration were retained. Nothing automatically restores the sample. Upload
it yourself to see the first-import results below. Integration tests roll back
all writes, so running them will not refill the development database.

## Decisions and observations

- `csv-parse` handles semicolons, escaped quotes, and multiline quoted descriptions.
  Decode strict UTF-8 first, otherwise Windows-1252, which renders the supplied
  legacy accents correctly. The fixture's characters alone do not distinguish
  Windows-1252 from ISO-8859-1. Preserve decoded original values.
- Validate the exact known sites/categories, real `DD.MM.YYYY` dates (including
  leap years), and positive decimal CHF amounts. Remove valid apostrophe thousands
  separators; use PostgreSQL numeric, not floating-point sums. Empty descriptions
  and technicians are accepted because the spec does not prohibit them.
- IDs are trimmed and uppercased because the fixture repeats IDs with spaces and
  different case. This identity interpretation matches the client's figures.
  A blank ID cannot identify a request and is rejected; no `ALP-` pattern is imposed.
- The first valid occurrence of an ID wins, including across uploads. Conflicting
  duplicates are reported without overwriting existing data; correction/update
  semantics are unspecified. A primary key and serialized import transaction
  prevent concurrent duplicate inserts. Invalid rows do not reserve an ID.
- Ranges filter `reported_on` from the chosen start inclusive to the day after
  the chosen end exclusive, using a date-only database column. Invalid, partial,
  or reversed ranges return 400. The filename never overrides request dates.
  With no API parameters, the previous calendar month is used in Europe/Belgrade.
  Browser shortcuts use calendar-day arithmetic, avoiding DST millisecond shifts.
- CSV export uses UTF-8 BOM, semicolons, CRLF, escaped fields, and decimal strings
  without thousands grouping. The header is `start_date;end_date;site;request_count;total_chf`.
- Files are limited to 5 MiB / 10000 rows. Malformed files return 400 without a
  partial import; oversized files return 413. Domain-invalid rows are returned
  alongside valid rows. Atomic persistence failures return 503.

## API and checks

| Endpoint | Purpose |
| --- | --- |
| `POST /api/imports` | Multipart CSV in field `file`; counts and row outcomes |
| `DELETE /api/imports` | Permanently delete all requests, imports, and row outcomes across all dates |
| `GET /api/imports/latest` | Latest result, or `null` before any import |
| `GET /api/reports?startDate=2026-03-01&endDate=2026-03-31` | Four-site report as JSON |
| `GET /api/reports/export?startDate=2026-03-01&endDate=2026-03-31` | Same date range as a CSV attachment |

```sh
npm --prefix backend test
npm --prefix backend run lint
npm --prefix backend run build
npm --prefix backend run prisma:validate
npm --prefix backend run test:integration
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
```

Vitest covers parsing, encoding, multiline fields, validation, dates, duplicates,
client control figures, and CSV export. Integration tests exercise PostgreSQL and
HTTP endpoints inside a rolled-back transaction: they leave no extra imports or
requests. Browser drag-and-drop/download interaction has not been automated.

Backend code is separated into controllers, services, repositories, modules,
utilities, types, and constants; Prisma schema/migrations are in `backend/prisma/`.
Frontend code separates API calls, hooks, types, utilities, pages, and components.
The interface has separate Import and Reports tabs. No request-management
browser, import-history browser, authentication, charts, or unrelated integrations
are included. Frontend tests use Node.js 24 built-in tests, with no added packages.
