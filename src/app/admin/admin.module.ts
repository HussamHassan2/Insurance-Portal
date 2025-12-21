import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';

import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminReportsComponent } from './pages/reports/admin-reports.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';

@NgModule({
    declarations: [
        AdminDashboardComponent,
        AdminUsersComponent,
        AdminReportsComponent,
        AdminSettingsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        AdminRoutingModule,
        SharedModule
    ]
})
export class AdminModule { }
