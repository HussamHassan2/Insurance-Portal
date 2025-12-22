import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrokerRoutingModule } from './broker-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ProgramSelectorComponent } from '../components/program-selector/program-selector.component';

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
import { BrokerPremiumsComponent } from './pages/premiums/broker-premiums.component';


import {
    LucideAngularModule, Shield, User, FileText, Calendar, CheckCircle, Download, ChevronRight,
    DollarSign, CreditCard, Phone, Mail, MapPin, Car, Award, TrendingUp,
    History, Clock, AlertCircle, ChevronLeft, Plus, Search, Filter,
    ArrowRight, Trash2, Edit, Eye, X, UploadCloud, File, RefreshCw,
    Home, Settings, LogOut, Menu, Bell, AlertTriangle, Paperclip, Loader2
} from 'lucide-angular';

import { BrokerQuotationDetailsComponent } from './pages/quotation-details/broker-quotation-details.component';
import { BrokerEndorsementComponent } from './pages/endorsement/broker-endorsement.component';
import { DueRenewalPoliciesComponent } from './pages/due-renewal-policies/due-renewal-policies.component';

@NgModule({
    declarations: [
        BrokerDashboardComponent,
        BrokerClientsComponent,
        BrokerPoliciesComponent,
        BrokerQuotationsComponent,
        BrokerQuotationDetailsComponent,
        ClientDetailsComponent,
        BrokerPolicyDetailsComponent,
        QuoteFlowComponent,
        CommissionsComponent,
        BrokerClaimsComponent,
        BrokerClaimDetailsComponent,
        BrokerPremiumsComponent,
        BrokerEndorsementComponent,
        DueRenewalPoliciesComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        BrokerRoutingModule,
        SharedModule,
        ProgramSelectorComponent,
        LucideAngularModule.pick({
            Shield, User, FileText, Calendar, CheckCircle, Download, ChevronRight,
            DollarSign, CreditCard, Phone, Mail, MapPin, Car, Award, TrendingUp,
            History, Clock, AlertCircle, ChevronLeft, Plus, Search, Filter,
            ArrowRight, Trash2, Edit, Eye, X, UploadCloud, File, RefreshCw,
            Home, Settings, LogOut, Menu, Bell, AlertTriangle, Paperclip, Loader2
        })
    ]
})
export class BrokerModule { }
