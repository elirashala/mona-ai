# Backend guidance

Follow the root AGENTS.md, README.md, and sample-data/spec.md. Use the existing
NestJS 12 provider/module conventions and Prisma 7 PostgreSQL driver adapter.
Keep controllers thin, services injectable, and database access in repositories.
All services, including PrismaService, belong in src/services/; generated client
code is not hand-edited. Use Vitest for parsing, validation, and export tests.
Do not install telemetry, authentication, or unrelated integrations.
