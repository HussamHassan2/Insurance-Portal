import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsRoutingModule } from './analytics-routing.module';
import { AnalyticsDashboardComponent } from './pages/dashboard/analytics-dashboard.component';
import { SharedModule } from '../shared/shared.module';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';

@NgModule({
    declarations: [
        AnalyticsDashboardComponent
    ],
    imports: [
        CommonModule,
        AnalyticsRoutingModule,
        SharedModule,
        NgChartsModule
    ]
})
export class AnalyticsModule { }
