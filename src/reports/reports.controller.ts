import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {

  constructor(private reportsService: ReportsService){}

  @Get('monthly')
  async getMonthlyReport(
    @Query('year') year:number,
    @Query('month') month:number
  ){
    return this.reportsService.monthlyEventSummary(year,month);
  }
}