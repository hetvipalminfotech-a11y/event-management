import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {

constructor(private reportsService: ReportsService){}

@Get('monthly-summary')
getMonthly(@Query('year') year:number,@Query('month') month:number){
return this.reportsService.monthlyEventSummary(year,month);
}

@Get('vendor-performance')
vendorPerformance(@Query('year') year:number,@Query('month') month:number){
return this.reportsService.vendorPerformance(year,month);
}

@Get('event-season')
eventSeason(){
return this.reportsService.eventTypeSeasonAnalysis();
}

@Get('vendor-utilisation')
vendorUtilisation(@Query('year') year:number,@Query('month') month:number){
return this.reportsService.vendorUtilisation(year,month);
}

}