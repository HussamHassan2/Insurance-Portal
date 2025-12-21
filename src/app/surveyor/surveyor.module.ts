import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SurveyorRoutingModule } from './surveyor-routing.module';
import { SharedModule } from '../shared/shared.module';

import { SurveyorDashboardComponent } from './pages/dashboard/surveyor-dashboard.component';
import { SurveyorPendingComponent } from './pages/pending/surveyor-pending.component';
import { SurveyDetailsComponent } from './pages/survey-details/survey-details.component';
import { SurveyorClaimsComponent } from './pages/claims/surveyor-claims.component';

@NgModule({
    declarations: [
        SurveyorDashboardComponent,
        SurveyorPendingComponent,
        SurveyDetailsComponent,
        SurveyorClaimsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SurveyorRoutingModule,
        SharedModule
    ]
})
export class SurveyorModule { }
