import { parse, CsvError } from 'csv-parse/sync';
import { COLUMNS } from '../constants/import.constants';
import { CsvFileError } from '../errors/csv-file.error';
import type { ParsedRow } from '../types/import.types';

interface CsvRecord {
  record: string[];
  info: { lines: number };
  raw: string;
}

export function parseCsv(buffer: Buffer): {
  encoding: string;
  rows: ParsedRow[];
} {
  if (!buffer.length) throw new CsvFileError('The upload is empty.');
  let text: string;
  let encoding = 'utf-8';
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    encoding = 'windows-1252';
    text = new TextDecoder(encoding).decode(buffer);
  }
  if (text.includes('\0'))
    throw new CsvFileError('Binary or UTF-16 files are not supported.');
  let records: CsvRecord[];
  try {
    records = parse(text, {
      delimiter: ';',
      bom: true,
      info: true,
      raw: true,
      record_delimiter: ['\r\n', '\n', '\r'],
      relax_column_count: true,
      max_record_size: 5 * 1024 * 1024,
      // csv-parse's sync overload omits the info:true wrapper from its return type.
    }) as unknown as CsvRecord[];
  } catch (error) {
    if (error instanceof CsvError) {
      throw new CsvFileError(
        `Malformed CSV at physical line ${String(error.lines)}: ${String(error.code)}.`,
      );
    }
    throw error;
  }
  const headerRecord = records.shift();
  const header = headerRecord?.record;
  if (
    !header ||
    COLUMNS.some((column) => !header.includes(column)) ||
    new Set(header).size !== header.length
  ) {
    throw new CsvFileError(
      `A unique header containing all columns is required: ${COLUMNS.join(';')}.`,
    );
  }
  let previousLine = headerRecord!.info.lines;
  const rows: ParsedRow[] = [];
  for (const { record, info, raw } of records) {
    const rowNumber = previousLine + 1;
    previousLine = info.lines;
    if (raw.replace(/\r\n|\n|\r/g, '') === '') continue;
    const original = Object.fromEntries(
      header.map((column, index) => [column, record[index] ?? '']),
    );
    if (record.length > header.length)
      original.__extra_fields = JSON.stringify(record.slice(header.length));
    rows.push({
      rowNumber,
      original,
      errors:
        record.length === header.length
          ? []
          : [
              {
                field: 'row',
                code: 'COLUMN_COUNT',
                message: `Expected ${header.length} fields, received ${record.length}.`,
              },
            ],
    });
    if (rows.length > 10000)
      throw new CsvFileError('Maximum 10000 data rows per upload.');
  }
  if (!rows.length) throw new CsvFileError('The CSV contains no data rows.');
  return { encoding, rows };
}
