import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImportsModule } from './modules/imports.module';
import { ReportsModule } from './modules/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ImportsModule,
    ReportsModule,
  ],
})
export class AppModule {}
