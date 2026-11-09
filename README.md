# Mona AI — Requests

Import CSV requests, review validation errors, and download reports by date.

Requires **Node.js 24.15+** and **Docker with Compose v2**. Start Docker first.
Run every command below from the **project root**.

## 1. Start PostgreSQL

```sh
docker compose -p mona-requests up -d
docker compose -p mona-requests ps
```

Wait until PostgreSQL shows `healthy`. Database port: **5434**.

## 2. Run the backend — terminal 1

First-time setup:

```sh
npm --prefix backend ci
cp -n backend/.env.example backend/.env
npm --prefix backend run prisma:deploy
```

Start the backend:

```sh
npm --prefix backend run start:dev
```

API: **http://localhost:3001**. Prisma Client is generated automatically.
On later runs, only the start command is needed.

## 3. Run the frontend — terminal 2

First-time setup:

```sh
npm --prefix frontend ci
cp -n frontend/.env.example frontend/.env
```

Start the frontend:

```sh
npm --prefix frontend run dev
```

Open **http://localhost:5173**. On later runs, only the start command is needed.
The `cp -n` commands preserve existing `.env` files.

## 4. Use the app

- **Import CSV:** select `sample-data/requests_2026-03.csv` and import it.
- **Reports:** choose dates and click **Download CSV**. To check the supplied
  file, select **1–31 March 2026**; the default is last calendar month.
- **Delete all data:** clears saved requests and import results after confirmation.

First import: **112 imported, 6 invalid, 3 duplicates**. Reimporting adds no
request duplicates. The March report contains **96 requests**.

## Stop

Press **Ctrl+C** in each app terminal, then stop Docker services:

```sh
docker compose -p mona-requests down
```

Saved database data is preserved. Nothing is seeded or imported automatically.

## Tests and checks

Keep Docker running and stop the backend dev server before build/integration checks.

```sh
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix backend run prisma:validate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend run test:integration
```

Integration tests roll back their changes and preserve existing data.

## Key decisions

- Follow `sample-data/spec.md`. Parse semicolon CSVs, legacy accents, and multiline fields.
- Trim/uppercase IDs for deduplication; the first valid record wins. A database
  primary key and transaction lock prevent duplicates across uploads.
- Validate real Swiss dates and positive amounts; use PostgreSQL decimal sums.
  Reports filter by the request date, not the filename. No seed data is included.
