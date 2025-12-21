import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerRoutingModule } from './customer-routing.module';
import { SharedModule } from '../shared/shared.module';

// Pages
import { CustomerDashboardComponent } from './pages/dashboard/customer-dashboard.component';
import { CustomerPoliciesComponent } from './pages/policies/customer-policies.component';
import { CustomerClaimsComponent } from './pages/claims/customer-claims.component';
import { CustomerQuotationsComponent } from './pages/quotations/customer-quotations.component';
import { QuotationDetailsComponent } from './pages/quotation-details/quotation-details.component';
import { PolicyDetailsComponent } from './pages/policy-details/policy-details.component';
import { ClaimDetailsComponent } from './pages/claim-details/claim-details.component';
import { CustomerPaymentsComponent } from './pages/payments/customer-payments.component';


@NgModule({
    declarations: [
        CustomerDashboardComponent,
        CustomerPoliciesComponent,
        CustomerClaimsComponent,
        CustomerQuotationsComponent,
        QuotationDetailsComponent,
        PolicyDetailsComponent,
        ClaimDetailsComponent,
        CustomerPaymentsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        CustomerRoutingModule,
        SharedModule
    ]
})
export class CustomerModule { }
