import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminReportsComponent } from './pages/reports/admin-reports.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';
import { ProfileComponent } from '../shared/pages/profile/profile.component';
import { SettingsComponent } from '../shared/pages/settings/settings.component';

const routes: Routes = [
    { path: '', component: AdminDashboardComponent },
    { path: 'users', component: AdminUsersComponent },
    { path: 'reports', component: AdminReportsComponent },
    { path: 'settings', component: AdminSettingsComponent },
    { path: 'profile', component: ProfileComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
