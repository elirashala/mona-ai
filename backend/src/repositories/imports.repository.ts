import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { evaluateRows } from '../utils/import-rules';
import type { ParsedRow } from '../types/import.types';

@Injectable()
export class ImportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAll() {
    return this.prisma.$transaction(
      async (tx) => {
        // Use the same lock as imports: a reset and an upload cannot interleave.
        await tx.$executeRaw`LOCK TABLE "Request" IN SHARE ROW EXCLUSIVE MODE`;
        const rows = await tx.importRow.deleteMany();
        const imports = await tx.importBatch.deleteMany();
        const requests = await tx.request.deleteMany();
        return {
          deletedRequests: requests.count,
          deletedImports: imports.count,
          deletedRows: rows.count,
        };
      },
      { maxWait: 30000, timeout: 60000 },
    );
  }

  async save(filename: string, encoding: string, rows: ParsedRow[]) {
    return this.prisma.$transaction(
      async (tx) => {
        // Serialize import writers so first-wins decisions and counts remain accurate
        // even when two uploads contain the same previously unseen request ID.
        await tx.$executeRaw`LOCK TABLE "Request" IN SHARE ROW EXCLUSIVE MODE`;
        const ids = rows.map((row) =>
          row.original.request_id.trim().toUpperCase(),
        );
        const existing = await tx.request.findMany({
          where: { requestId: { in: ids } },
          select: { requestId: true },
        });
        const evaluated = evaluateRows(
          rows,
          new Set(existing.map((request) => request.requestId)),
        );
        const batch = await tx.importBatch.create({
          data: {
            filename,
            encoding,
            totalRows: evaluated.length,
            importedCount: evaluated.filter((row) => row.status === 'imported')
              .length,
            invalidCount: evaluated.filter((row) => row.status === 'invalid')
              .length,
            duplicateCount: evaluated.filter(
              (row) => row.status === 'duplicate',
            ).length,
          },
        });
        for (let offset = 0; offset < evaluated.length; offset += 500) {
          const chunk = evaluated.slice(offset, offset + 500);
          const requests = chunk.flatMap((row) =>
            row.status === 'imported' && row.request ? [row.request] : [],
          );
          if (requests.length) await tx.request.createMany({ data: requests });
          await tx.importRow.createMany({
            data: chunk.map((row) => ({
              importId: batch.id,
              rowNumber: row.rowNumber,
              status: row.status,
              requestId: row.request?.requestId ?? null,
              original: row.original,
              errors: row.errors.map((error) => ({ ...error })),
            })),
          });
        }
        return tx.importBatch.findUniqueOrThrow({
          where: { id: batch.id },
          include: { rows: { orderBy: { rowNumber: 'asc' } } },
        });
      },
      { maxWait: 30000, timeout: 60000 },
    );
  }

  latest() {
    return this.prisma.importBatch.findFirst({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });
  }
}
