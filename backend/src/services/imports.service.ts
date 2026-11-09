import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
// Type-only import: loads Express.Multer.File without adding a runtime import.
import type {} from 'multer';
import { parseCsv } from '../utils/csv-parser';
import { CsvFileError } from '../errors/csv-file.error';
import { ImportsRepository } from '../repositories/imports.repository';

@Injectable()
export class ImportsService {
  constructor(private readonly repository: ImportsRepository) {}

  async deleteAll() {
    try {
      return await this.repository.deleteAll();
    } catch {
      throw new ServiceUnavailableException(
        'Could not delete saved data. The deletion was rolled back; please try again.',
      );
    }
  }

  latest() {
    return this.repository.latest();
  }

  async upload(file?: Express.Multer.File) {
    if (!file)
      throw new BadRequestException(
        'Upload a CSV using the multipart field "file".',
      );
    let parsed: ReturnType<typeof parseCsv>;
    try {
      parsed = parseCsv(file.buffer);
    } catch (error) {
      if (error instanceof CsvFileError)
        throw new BadRequestException(error.message);
      throw error;
    }
    try {
      return await this.repository.save(
        file.originalname,
        parsed.encoding,
        parsed.rows,
      );
    } catch {
      throw new ServiceUnavailableException(
        'Import could not be saved. No rows from this upload were committed; retry later.',
      );
    }
  }
}
