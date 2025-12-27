import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SurveyorRoutingModule } from './surveyor-routing.module';
import { SharedModule } from '../shared/shared.module';

import { SurveyorDashboardComponent } from './pages/dashboard/surveyor-dashboard.component';
import { SurveyorPendingComponent } from './pages/pending/surveyor-pending.component';
import { SurveyDetailsComponent } from './pages/survey-details/survey-details.component';
import { SurveyorClaimsComponent } from './pages/claims/surveyor-claims.component';
import { SurveyWizardComponent } from './components/survey-wizard/survey-wizard.component';
import { SurveyExclusionsComponent } from './components/survey-exclusions/survey-exclusions.component';
import { IssuanceSurveyFormComponent } from './components/issuance-survey-form/issuance-survey-form.component';
import { ClaimSurveyFormComponent } from './components/claim-survey-form/claim-survey-form.component';

import { ReactiveFormsModule } from '@angular/forms';
import { AddEstimationItemModalComponent } from './components/add-estimation-item-modal/add-estimation-item-modal.component';

@NgModule({
    declarations: [
        SurveyorDashboardComponent,
        SurveyorPendingComponent,
        SurveyDetailsComponent,
        SurveyorClaimsComponent,
        SurveyWizardComponent,
        IssuanceSurveyFormComponent,
        ClaimSurveyFormComponent,
        AddEstimationItemModalComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SurveyorRoutingModule,
        SharedModule,
        SurveyExclusionsComponent
    ]
})
export class SurveyorModule { }
