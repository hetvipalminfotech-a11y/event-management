import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { EventBookingsModule } from './event-bookings/event-bookings.module';
import { VendorAssignmentModule } from './vendor-assignment/vendor-assignment.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/role.guard';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './task/task.module';
import { AuditModule } from './audit/audit.module';
import { RequestContextMiddleware } from './audit/context/request-context.middleware';
import { AuditSubscriber } from './audit/subscribers/audit.subscriber';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TasksModule,
    TypeOrmModule.forRootAsync(databaseConfig),
    UsersModule, VendorsModule, EventBookingsModule, VendorAssignmentModule, AuthModule, ReportsModule, AuditModule],
  
  controllers: [AppController],
  providers: [AppService, AuditSubscriber],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes('*');
  }
}
