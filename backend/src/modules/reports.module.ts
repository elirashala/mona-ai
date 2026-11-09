import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsRepository } from '../repositories/reports.repository';
import { ReportsService } from '../services/reports.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
