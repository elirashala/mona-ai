const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const request = require('supertest');
const { parse } = require('csv-parse/sync');
const { AppModule } = require('../dist/app.module');
const { PrismaService } = require('../dist/services/prisma.service');
const {
  ImportsRepository,
} = require('../dist/repositories/imports.repository');
const {
  ReportsRepository,
} = require('../dist/repositories/reports.repository');
const { ImportsService } = require('../dist/services/imports.service');
const { ReportsService } = require('../dist/services/reports.service');
const { ImportsController } = require('../dist/controllers/imports.controller');
const { ReportsController } = require('../dist/controllers/reports.controller');
const rollback = new Error('intentional test rollback');

async function main() {
  const real = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  const prisma = real.get(PrismaService);
  try {
    await real.init();
    const live = request(real.getHttpServer());
    const initialLatest = await live.get('/api/imports/latest').expect(200);
    if ((await prisma.importBatch.count()) === 0)
      assert.equal(initialLatest.body, null);
    const liveReport = await live
      .get('/api/reports?startDate=2026-03-01&endDate=2026-03-31')
      .expect(200);
    assert.equal(liveReport.body.rows.length, 4);
    const before = {
      requests: await prisma.request.count(),
      imports: await prisma.importBatch.count(),
      rows: await prisma.importRow.count(),
    };
    try {
      await prisma.$transaction(
        async (tx) => {
          const client = new Proxy(tx, {
            get(target, key) {
              if (key === '$transaction')
                return (queries) =>
                  typeof queries === 'function'
                    ? queries(client)
                    : Promise.all(queries);
              const value = Reflect.get(target, key);
              return typeof value === 'function' ? value.bind(target) : value;
            },
          });
          const imports = new ImportsService(new ImportsRepository(client));
          const reports = new ReportsService(new ReportsRepository(client));
          class TestApp {}
          Module({
            controllers: [ImportsController, ReportsController],
            providers: [
              { provide: ImportsService, useValue: imports },
              { provide: ReportsService, useValue: reports },
            ],
          })(TestApp);
          const app = await NestFactory.create(TestApp, {
            logger: false,
            abortOnError: false,
          });
          app.enableCors({ origin: 'http://localhost:5173' });
          try {
            await app.init();
            const api = request(app.getHttpServer());
            const fixture = readFileSync('sample-data/requests_2026-03.csv');
            const upload = () =>
              api
                .post('/api/imports')
                .attach('file', fixture, 'requests_2026-03.csv');
            const first = await upload().expect(201);
            assert.equal(first.body.totalRows, 121);
            assert.equal(first.body.invalidCount, 6);
            assert.equal(
              first.body.importedCount + first.body.duplicateCount,
              115,
            );
            assert.equal(
              first.body.rows.find((r) => r.original.request_id === 'ALP-0118')
                .errors[0].code,
              'INVALID_DATE',
            );
            const latest = await api.get('/api/imports/latest').expect(200);
            assert.equal(latest.body.id, first.body.id);
            const count = await tx.request.count();
            const second = await upload().expect(201);
            assert.equal(second.body.importedCount, 0);
            assert.equal(second.body.duplicateCount, 115);
            assert.equal(await tx.request.count(), count);
            const report = await api
              .get('/api/reports?startDate=2026-03-01&endDate=2026-03-31')
              .set('Origin', 'http://localhost:5173')
              .expect(200);
            assert.equal(
              report.headers['access-control-allow-origin'],
              'http://localhost:5173',
            );
            assert.equal(report.body.totalRequests, 96);
            for (const [site, expectedCount, amount] of [
              ['Zürich-Oerlikon', 31, '48375.90'],
              ['Genève-Plainpalais', 19, '35889.90'],
              ['Basel-St. Johann', 26, '33209.85'],
              ['Lugano-Centro', 20, '30183.65'],
            ]) {
              assert.deepEqual(
                report.body.rows.find((r) => r.site === site),
                { site, requestCount: expectedCount, totalAmountChf: amount },
              );
            }
            const csv = await api
              .get(
                '/api/reports/export?startDate=2026-03-01&endDate=2026-03-31',
              )
              .expect(200);
            assert.match(csv.headers['content-type'], /text\/csv/);
            assert.match(
              csv.headers['content-disposition'],
              /attachment.*report-2026-03-01-2026-03-31\.csv/,
            );
            const csvRows = parse(csv.text, {
              columns: true,
              delimiter: ';',
              bom: true,
            });
            assert.equal(csvRows.length, 4);
            assert.equal(csvRows[0].start_date, '2026-03-01');
            assert.equal(csvRows[0].end_date, '2026-03-31');
            assert.equal(csvRows[0].site, 'Zürich-Oerlikon');
            assert.equal(csvRows[0].total_chf, '48375.90');
            const single = await api
              .get('/api/reports?startDate=2026-03-31&endDate=2026-03-31')
              .expect(200);
            assert(single.body.totalRequests > 0);
            const expectedDay = await tx.request.count({
              where: { reportedOn: new Date('2026-03-31T00:00:00Z') },
            });
            assert.equal(single.body.totalRequests, expectedDay);
            const outside = await api
              .get('/api/reports?startDate=2025-01-01&endDate=2025-01-31')
              .expect(200);
            assert.equal(outside.body.totalRequests, 0);
            assert.equal(outside.body.rows.length, 4);
            assert(
              outside.body.rows.every((row) => row.totalAmountChf === '0.00'),
            );
            for (const query of [
              'startDate=2026-02-30&endDate=2026-03-01',
              'startDate=2026-03-31&endDate=2026-03-01',
              'startDate=2026-03-01',
            ]) {
              await api.get(`/api/reports?${query}`).expect(400);
              await api.get(`/api/reports/export?${query}`).expect(400);
            }
            await api.post('/api/imports').expect(400);
            await api
              .post('/api/imports')
              .attach('file', Buffer.alloc(0), 'empty.csv')
              .expect(400);
            await api
              .post('/api/imports')
              .attach('file', Buffer.from('bad;header\na;b'), 'bad.csv')
              .expect(400);
            await api
              .post('/api/imports')
              .attach(
                'file',
                Buffer.alloc(5 * 1024 * 1024 + 1, 'a'),
                'large.csv',
              )
              .expect(413);

            const expectedDeleted = {
              deletedRequests: await tx.request.count(),
              deletedImports: await tx.importBatch.count(),
              deletedRows: await tx.importRow.count(),
            };
            const deleted = await api.delete('/api/imports').expect(200);
            assert.deepEqual(deleted.body, expectedDeleted);
            assert.equal(await tx.request.count(), 0);
            assert.equal(await tx.importBatch.count(), 0);
            assert.equal(await tx.importRow.count(), 0);
            const clearedLatest = await api
              .get('/api/imports/latest')
              .expect(200);
            assert.equal(clearedLatest.body, null);
            const clearedReport = await api
              .get('/api/reports?startDate=2026-03-01&endDate=2026-03-31')
              .expect(200);
            assert.equal(clearedReport.body.totalRequests, 0);
            assert(
              clearedReport.body.rows.every(
                (row) =>
                  row.requestCount === 0 && row.totalAmountChf === '0.00',
              ),
            );
            const emptyDelete = await api.delete('/api/imports').expect(200);
            assert.deepEqual(emptyDelete.body, {
              deletedRequests: 0,
              deletedImports: 0,
              deletedRows: 0,
            });
            // Reset also clears deduplication IDs, so a fresh import works again.
            const fresh = await upload().expect(201);
            assert.equal(fresh.body.importedCount, 112);
            assert.equal(fresh.body.invalidCount, 6);
            assert.equal(fresh.body.duplicateCount, 3);
          } finally {
            await app.close();
          }
          throw rollback;
        },
        { timeout: 60000 },
      );
    } catch (error) {
      if (error !== rollback) throw error;
    }
    assert.equal(await prisma.request.count(), before.requests);
    assert.equal(await prisma.importBatch.count(), before.imports);
    assert.equal(await prisma.importRow.count(), before.rows);
    console.log(
      'Integration passed: import, validation, duplicates, reports, CSV export, delete-all, empty state, and fresh reimport. All test changes were rolled back.',
    );
  } finally {
    await real.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
