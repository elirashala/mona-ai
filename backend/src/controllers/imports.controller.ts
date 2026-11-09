import {
  Controller,
  Delete,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// Explicitly load Multer's Express namespace augmentation in watch mode.
import type {} from 'multer';
import type { Response } from 'express';
import { ImportsService } from '../services/imports.service';

@Controller('api/imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Delete()
  deleteAll() {
    return this.service.deleteAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.service.upload(file);
  }

  @Get('latest')
  async latest(@Res() response: Response) {
    // Explicit JSON keeps an empty database as `null`, not an empty HTTP body.
    response.json(await this.service.latest());
  }
}
