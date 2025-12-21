import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuoteWizardComponent } from './components/quote-wizard/quote-wizard.component';
import { MotorDetailsComponent } from './components/motor-details/motor-details.component';
import { DriverDetailsComponent } from './components/driver-details/driver-details.component';
import { CoverageSelectionComponent } from './components/coverage-selection/coverage-selection.component';

const routes: Routes = [
  {
    path: '',
    component: QuoteWizardComponent,
    children: [
      { path: '', redirectTo: 'vehicle', pathMatch: 'full' },
      { path: 'vehicle', component: MotorDetailsComponent },
      { path: 'driver', component: DriverDetailsComponent },
      { path: 'coverage', component: CoverageSelectionComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuoteRoutingModule { }
