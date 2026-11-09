export type OriginalRow = Record<string, string>;
export interface RowError {
  field: string;
  code: string;
  message: string;
}
export interface ParsedRow {
  rowNumber: number;
  original: OriginalRow;
  errors: RowError[];
}
export interface ValidRequest {
  requestId: string;
  site: string;
  reportedOn: Date;
  category: string;
  description: string;
  amountChf: string;
  technician: string;
  original: OriginalRow;
}
export interface EvaluatedRow extends ParsedRow {
  request?: ValidRequest;
  status: 'imported' | 'invalid' | 'duplicate';
}
