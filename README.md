# Mona AI — Requests

Import CSV requests, review validation errors, and download reports by date.

Requires **Node.js 24.15+** and **Docker with Compose v2**. Start Docker first.
Run every command below from the **project root**.

```text
backend/             API, Prisma, tests, and sample-data/
frontend/            React application
docker-compose.yml   PostgreSQL configuration
README.md            Setup and application guide
.gitignore           Ignore rules for both applications
```

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
The frontend API URL is configured by `VITE_API_URL` in `frontend/.env`;
it defaults to `http://localhost:3001`.

## 4. Use the app

- **Import CSV:** select `backend/sample-data/requests_2026-03.csv` and import it.
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

## How it works

- **Frontend:** React + TypeScript + Vite. Pages/components render the two tabs;
  hooks handle state, `api/` handles HTTP, and `types/` and `utils/` hold shared helpers.
- **Backend:** NestJS controllers call services and repositories. Prisma 7 accesses
  PostgreSQL 17; schema and migrations live in `backend/prisma/`.
- **Import:** parse semicolon CSVs with UTF-8/Windows-1252 accents and multiline
  quoted fields. Follow `backend/sample-data/spec.md`: known sites/categories, real Swiss
  dates, and positive amounts. Valid requests are saved; original values, errors,
  and upload counts are retained separately for the results screen. No seed data.
- **Duplicates:** trim/uppercase IDs; the first valid record wins. A primary key
  and transaction lock prevent duplicates within a file and across uploads.
- **Reports:** filter by request date, group by site, and sum CHF using database
  decimals. The screen and CSV use the same inclusive date range. Confirming
  **Delete all data** clears application records, leaving the schema intact.

## Submission

The ZIP is only needed when submitting; it is not part of the running app.
Include source, migrations, lockfiles, `.env.example`, and `backend/sample-data/`.
Exclude `node_modules/`, `dist/`, generated Prisma Client, `.env`, and
`*.tsbuildinfo` from the ZIP. `.gitignore` does not filter a manually created ZIP.
