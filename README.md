# Mona AI — Requests

A TypeScript app for importing service requests, reviewing invalid rows, and
exporting reports by site and date. Built with React, NestJS, Prisma, and PostgreSQL.

## Requirements

- Node.js **24.15+**
- Docker with Compose v2, running locally

Open each terminal at the project root.

## 1. Start the database

```sh
docker compose -p mona-requests up -d
docker compose -p mona-requests ps
```

Wait for PostgreSQL to show `healthy`. It uses port **5434** and stores data in a
named Docker volume.

## 2. Start the backend

In a separate terminal:

```sh
cd backend
npm ci
cp -n .env.example .env
npm run prisma:deploy
npm run start:dev
```

The API runs at **http://localhost:3001**. Prisma Client is generated automatically
before startup. The environment file contains the local database connection.

## 3. Start the frontend

In another terminal:

```sh
cd frontend
npm ci
cp -n .env.example .env
npm run dev
```

Open **http://localhost:5173**. `VITE_API_URL` in `frontend/.env` sets the API URL
and defaults to `http://localhost:3001`. Restart Vite after changing it.

The copy commands preserve existing `.env` files. After the first setup, start
Docker and run only `npm run start:dev` in `backend/` and `npm run dev` in `frontend/`.

## Use the app

- **Import CSV:** upload `backend/sample-data/requests_2026-03.csv` and review the results.
- **Reports:** choose a date range and download the site report as CSV. The default
  is last calendar month; select **1–31 March 2026** for the supplied sample.
- **Delete all data:** permanently clears saved requests and import results after confirmation.

The sample produces **112 imported, 6 invalid, and 3 duplicate rows** on its first
import. Reimporting creates no duplicate requests. The March report has **96 requests**.

## Tests and builds

Stop the dev servers with **Ctrl+C** first. Keep Docker running for integration tests.
Run these commands in the existing backend terminal (`backend/`):

```sh
npm test
npm run lint
npm run prisma:validate
npm run build
npm run test:integration
```

In the frontend terminal (`frontend/`):

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Integration tests roll back their database changes, preserving existing data.

## Stop the database

After stopping both apps, run this in the project-root terminal:

```sh
docker compose -p mona-requests down
```

The named volume keeps saved data. No sample data is imported automatically.

## How it works

- **Frontend:** pages and components display the UI; hooks manage state and API calls.
- **Backend:** controllers delegate to services and repositories. Prisma manages
  database access; schema and migrations are in `backend/prisma/`.
- **Validation:** follow `backend/sample-data/spec.md`. Handle semicolon CSVs,
  UTF-8/Windows-1252 text, quoted multiline fields, real Swiss dates, and positive amounts.
  Valid requests are saved; original values and validation errors are retained separately.
- **Deduplication:** trim and uppercase IDs; the first valid record wins. A primary
  key and transaction lock prevent duplicates within a file and across uploads.
- **Reporting:** filter by request date and sum CHF using database decimals. Both
  selected dates are included, and the screen and CSV use the same range.

## Submission

Submit one ZIP under **25 MB** containing source, migrations, lockfiles,
`.env.example` files, and `backend/sample-data/`.

Exclude `.git/`, `node_modules/`, `dist/`, generated Prisma Client, `.env` files,
and `*.tsbuildinfo`. A manual ZIP does not automatically follow `.gitignore`.
