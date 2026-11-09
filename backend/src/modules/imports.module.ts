import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ImportsController } from '../controllers/imports.controller';
import { ImportsRepository } from '../repositories/imports.repository';
import { ImportsService } from '../services/imports.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImportsController],
  providers: [ImportsRepository, ImportsService],
})
export class ImportsModule {}
