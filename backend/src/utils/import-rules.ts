import type { EvaluatedRow, ParsedRow } from '../types/import.types';
import { validateRow } from './request-validation';

export function evaluateRows(
  rows: ParsedRow[],
  existingIds: ReadonlySet<string>,
): EvaluatedRow[] {
  const seen = new Set(existingIds);
  return rows.map((row) => {
    const { errors, request } = validateRow(row);
    if (!request) return { ...row, errors, status: 'invalid' };
    if (seen.has(request.requestId))
      return {
        ...row,
        request,
        status: 'duplicate',
        errors: [
          {
            field: 'request_id',
            code: 'DUPLICATE_ID',
            message:
              'Request already exists or an earlier valid row has this ID; existing data retained.',
          },
        ],
      };
    seen.add(request.requestId);
    return { ...row, errors, request, status: 'imported' };
  });
}
