import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrokerDashboardComponent } from './pages/dashboard/broker-dashboard.component';
import { BrokerClientsComponent } from './pages/clients/broker-clients.component';
import { BrokerPoliciesComponent } from './pages/policies/broker-policies.component';
import { BrokerQuotationsComponent } from './pages/quotations/broker-quotations.component';
import { ClientDetailsComponent } from './pages/client-details/client-details.component';
import { BrokerPolicyDetailsComponent } from './pages/policy-details/broker-policy-details.component';
import { QuoteFlowComponent } from './pages/quote-flow/quote-flow.component';
import { CommissionsComponent } from './pages/commissions/commissions.component';
import { BrokerClaimsComponent } from './pages/claims/broker-claims.component';
import { BrokerClaimDetailsComponent } from './pages/claim-details/broker-claim-details.component';
import { FileClaimComponent } from '../shared/pages/file-claim/file-claim.component';
import { BrokerPremiumsComponent } from './pages/premiums/broker-premiums.component';
import { ProfileComponent } from '../shared/pages/profile/profile.component';
import { SettingsComponent } from '../shared/pages/settings/settings.component';
import { BrokerQuotationDetailsComponent } from './pages/quotation-details/broker-quotation-details.component';
import { BrokerEndorsementComponent } from './pages/endorsement/broker-endorsement.component';
import { DueRenewalPoliciesComponent } from './pages/due-renewal-policies/due-renewal-policies.component';

const routes: Routes = [
    { path: '', component: BrokerDashboardComponent },
    { path: 'clients', component: BrokerClientsComponent },
    { path: 'clients/:id', component: ClientDetailsComponent },
    { path: 'policies', component: BrokerPoliciesComponent },
    { path: 'due-renewal-policies', component: DueRenewalPoliciesComponent },
    { path: 'policies/:id', component: BrokerPolicyDetailsComponent },
    { path: 'endorsement/:id', component: BrokerEndorsementComponent },
    { path: 'quotations', component: BrokerQuotationsComponent }, // Default (All)
    { path: 'quotations/renewal-requests', component: BrokerQuotationsComponent, data: { filterType: 'renewal' } },
    { path: 'quotations/endorsement-requests', component: BrokerQuotationsComponent, data: { filterType: 'endorsement' } },
    { path: 'quotations/lost-requests', component: BrokerQuotationsComponent, data: { filterType: 'lost' } },
    { path: 'quotations/:id', component: BrokerQuotationDetailsComponent },
    { path: 'quote/new', component: QuoteFlowComponent },
    { path: 'commissions', component: CommissionsComponent },
    { path: 'claims', component: BrokerClaimsComponent },
    { path: 'claims/new', component: FileClaimComponent },
    { path: 'claims/:id', component: BrokerClaimDetailsComponent },
    { path: 'premiums', component: BrokerPremiumsComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'settings', component: SettingsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BrokerRoutingModule { }
