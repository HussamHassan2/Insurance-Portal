import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
    // Public routes
    {
        path: '',
        loadChildren: () => import('./public/public.module').then(m => m.PublicModule)
    },
    {
        path: 'quote',
        loadChildren: () => import('./quote/quote.module').then(m => m.QuoteModule)
    },
    {
        path: 'client-dashboard',
        loadComponent: () => import('./tenant-dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'ocr',
        loadChildren: () => import('./features/ocr/ocr.routes').then(m => m.OCR_ROUTES),
        canActivate: [AuthGuard]
    },

    // Dashboard redirect based on role
    {
        path: 'dashboard',
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                redirectTo: 'customer',
                pathMatch: 'full'
            },
            {
                path: 'customer',
                canActivate: [RoleGuard],
                data: { allowedRoles: ['customer'] },
                loadChildren: () => import('./customer/customer.module').then(m => m.CustomerModule)
            },
            {
                path: 'broker',
                canActivate: [RoleGuard],
                data: { allowedRoles: ['broker'] },
                loadChildren: () => import('./broker/broker.module').then(m => m.BrokerModule)
            },
            {
                path: 'admin',
                canActivate: [RoleGuard],
                data: { allowedRoles: ['admin'] },
                loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
            },
            {
                path: 'surveyor',
                canActivate: [RoleGuard],
                data: { allowedRoles: ['surveyor'] },
                loadChildren: () => import('./surveyor/surveyor.module').then(m => m.SurveyorModule)
            },
            {
                path: 'analytics',
                // Shared, logic for access can be added if needed, typically protected by AuthGuard from parent
                loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule)
            }
        ]
    },

    // Fallback
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
