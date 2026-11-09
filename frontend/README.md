# Frontend

See the [root README](../README.md) for setup and task decisions.

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Use Node.js 24. Open http://localhost:5173 with the backend on port 3001.
`VITE_API_URL` defaults to that API origin. The Import tab contains CSV upload and validation outcomes. The Reports tab
contains a four-site report, calendar date inputs, left-side date shortcuts,
and **Download CSV**. The default is the previous calendar month. Select March
1–31, 2026 to inspect the supplied fixture.
There are no additional frontend dependencies. State lives in hooks, HTTP calls
in `src/api/`, interfaces in `src/types/`, and formatters in `src/utils/`.

Verify with `npm --prefix frontend test`, `run typecheck`, `run lint`, and
`run build`. Strict Mode remains enabled; deferred resource reads avoid its
discarded setup sending a duplicate initial request.
