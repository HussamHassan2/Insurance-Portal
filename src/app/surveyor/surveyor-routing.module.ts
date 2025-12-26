import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SurveyorDashboardComponent } from './pages/dashboard/surveyor-dashboard.component';
import { SurveyorPendingComponent } from './pages/pending/surveyor-pending.component';
import { SurveyDetailsComponent } from './pages/survey-details/survey-details.component';
import { SurveyorClaimsComponent } from './pages/claims/surveyor-claims.component';
import { SurveyStagesComponent } from './pages/stages/survey-stages.component';
import { ProfileComponent } from '../shared/pages/profile/profile.component';
import { SettingsComponent } from '../shared/pages/settings/settings.component';

import { SurveyWizardComponent } from './components/survey-wizard/survey-wizard.component';

const routes: Routes = [
    { path: '', component: SurveyorDashboardComponent },
    { path: 'stages', component: SurveyStagesComponent },
    { path: 'pending', component: SurveyorPendingComponent },
    { path: 'suspended', component: SurveyorPendingComponent },
    { path: 'in-progress', component: SurveyorPendingComponent },
    { path: 'surveys/:id', component: SurveyDetailsComponent },
    { path: 'wizard/:id', component: SurveyWizardComponent },
    { path: 'claims', component: SurveyorClaimsComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'settings', component: SettingsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SurveyorRoutingModule { }
