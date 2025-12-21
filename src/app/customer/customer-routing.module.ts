import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerDashboardComponent } from './pages/dashboard/customer-dashboard.component';
import { CustomerPoliciesComponent } from './pages/policies/customer-policies.component';
import { CustomerClaimsComponent } from './pages/claims/customer-claims.component';
import { CustomerQuotationsComponent } from './pages/quotations/customer-quotations.component';
import { QuotationDetailsComponent } from './pages/quotation-details/quotation-details.component';
import { PolicyDetailsComponent } from './pages/policy-details/policy-details.component';
import { ClaimDetailsComponent } from './pages/claim-details/claim-details.component';
import { CustomerPaymentsComponent } from './pages/payments/customer-payments.component';
import { ProfileComponent } from '../shared/pages/profile/profile.component';
import { SettingsComponent } from '../shared/pages/settings/settings.component';
import { FileClaimComponent } from '../shared/pages/file-claim/file-claim.component';

const routes: Routes = [
    { path: '', component: CustomerDashboardComponent },
    { path: 'policies', component: CustomerPoliciesComponent },
    { path: 'policies/:id', component: PolicyDetailsComponent },
    { path: 'claims', component: CustomerClaimsComponent },
    { path: 'claims/:id', component: ClaimDetailsComponent },
    { path: 'quotations', component: CustomerQuotationsComponent },
    { path: 'quotations/:id', component: QuotationDetailsComponent },
    { path: 'payments', component: CustomerPaymentsComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'claims/new', component: FileClaimComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CustomerRoutingModule { }
