import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    template: `
    <app-dashboard-layout>
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-6 text-white">
          <h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p class="text-blue-100">Welcome, {{ user?.name || 'Admin' }}!</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <app-card *ngFor="let stat of stats" [hover]="true">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stat.title }}</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{{ stat.value }}</p>
            </div>
          </app-card>
        </div>

        <app-card title="System Overview">
          <p class="text-gray-600 dark:text-gray-400">Admin portal is ready. Manage users, view reports, and configure system settings.</p>
        </app-card>
      </div>
    </app-dashboard-layout>
  `,
    styles: []
})
export class AdminDashboardComponent implements OnInit {
    user: User | null = null;
    stats = [
        { title: 'Total Users', value: '0' },
        { title: 'Active Policies', value: '0' },
        { title: 'System Health', value: '100%' }
    ];

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            this.user = user;
        });
    }
}
