import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CrmService } from '../../../core/services/crm.service';
import { QuoteService } from '../../../core/services/quote.service';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  template: `
    <div class="space-y-6">
      <!-- Welcome Section -->
      <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 class="text-2xl font-bold text-navy dark:text-white">Welcome back, {{ userName }}!</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your insurance policies.</p>
        </div>
        <button [routerLink]="['/dashboard/customer/quote/new']" 
          class="hidden sm:flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-blue-500/30">
          <i data-lucide="plus-circle" class="w-5 h-5"></i>
          Get New Quote
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Active Policies -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start mb-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <i data-lucide="shield-check" class="w-6 h-6 text-green-600 dark:text-green-400"></i>
            </div>
            <span class="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Policies</h3>
          <p class="text-2xl font-bold text-navy dark:text-white mt-1">{{ stats.activePolicies }}</p>
        </div>

        <!-- Pending Quotes -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start mb-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <i data-lucide="file-text" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
            </div>
            <span class="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">Pending</span>
          </div>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Quotes</h3>
          <p class="text-2xl font-bold text-navy dark:text-white mt-1">{{ stats.pendingQuotes }}</p>
        </div>

        <!-- Open Claims -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start mb-4">
            <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <i data-lucide="alert-circle" class="w-6 h-6 text-orange-600 dark:text-orange-400"></i>
            </div>
            <span class="text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">Open</span>
          </div>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Open Claims</h3>
          <p class="text-2xl font-bold text-navy dark:text-white mt-1">{{ stats.openClaims }}</p>
        </div>

        <!-- Total Premium -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start mb-4">
            <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <i data-lucide="wallet" class="w-6 h-6 text-purple-600 dark:text-purple-400"></i>
            </div>
          </div>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Premium</h3>
          <p class="text-2xl font-bold text-navy dark:text-white mt-1">{{ stats.totalPremium | currency:'EGP ' }}</p>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Quotes -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 class="font-bold text-lg text-navy dark:text-white">Recent Quotations</h2>
            <a routerLink="/dashboard/customer/quotations" class="text-blue-600 text-sm font-medium hover:text-blue-700">View All</a>
          </div>
          <div class="p-6">
            <div *ngIf="loading" class="flex justify-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <div *ngIf="!loading && recentQuotes.length === 0" class="text-center py-8 text-gray-500">
              No recent quotations found.
            </div>
            <div *ngIf="!loading && recentQuotes.length > 0" class="space-y-4">
              <div *ngFor="let quote of recentQuotes" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" [routerLink]="['/dashboard/customer/quotations', quote.id]">
                <div class="flex items-center gap-4">
                  <div class="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                    <i data-lucide="file-text" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-navy dark:text-white">{{ quote.opportunity_number || 'New Quote' }}</h4>
                    <p class="text-xs text-gray-500">{{ quote.create_date | date:'mediumDate' }}</p>
                  </div>
                </div>
                <div class="text-right">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                            'bg-yellow-100 text-yellow-800': quote.stage_name === 'New',
                            'bg-blue-100 text-blue-800': quote.stage_name === 'Proposition',
                            'bg-green-100 text-green-800': quote.stage_name === 'Won',
                            'bg-red-100 text-red-800': quote.stage_name === 'Lost'
                        }">
                        {{ quote.stage_name }}
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 class="font-bold text-lg text-navy dark:text-white">Quick Actions</h2>
          </div>
          <div class="p-6 grid grid-cols-2 gap-4">
            <a routerLink="/dashboard/customer/quote/new" class="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-center cursor-pointer">
              <div class="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                <i data-lucide="plus" class="w-5 h-5"></i>
              </div>
              <h3 class="font-medium text-navy dark:text-white">New Quote</h3>
              <p class="text-xs text-gray-500 mt-1">Get instant price</p>
            </a>
            
            <a routerLink="/dashboard/customer/claims/new" class="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group text-center cursor-pointer">
              <div class="w-10 h-10 mx-auto bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors text-orange-600">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
              <h3 class="font-medium text-navy dark:text-white">File Claim</h3>
              <p class="text-xs text-gray-500 mt-1">Report an incident</p>
            </a>

            <a routerLink="/dashboard/customer/policies" class="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group text-center cursor-pointer">
              <div class="w-10 h-10 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors text-green-600">
                <i data-lucide="shield" class="w-5 h-5"></i>
              </div>
              <h3 class="font-medium text-navy dark:text-white">My Policies</h3>
              <p class="text-xs text-gray-500 mt-1">View active coverage</p>
            </a>

            <a routerLink="/dashboard/customer/profile" class="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group text-center cursor-pointer">
              <div class="w-10 h-10 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600">
                <i data-lucide="user" class="w-5 h-5"></i>
              </div>
              <h3 class="font-medium text-navy dark:text-white">Profile</h3>
              <p class="text-xs text-gray-500 mt-1">Update details</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerHomeComponent implements OnInit, AfterViewChecked {
  userName = 'User';
  loading = true;
  stats = {
    activePolicies: 0,
    pendingQuotes: 0,
    openClaims: 0,
    totalPremium: 0
  };
  recentQuotes: any[] = [];

  constructor(
    private crmService: CrmService,
    private quoteService: QuoteService,
    private authService: AuthService,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.userName = this.authService.currentUserValue?.name || 'User';
    this.loadDashboardData();
  }

  ngAfterViewChecked() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      const user = this.authService.currentUserValue;
      const userId = user?.id || 2; // Default for dev

      // Fetch Quotes for Stats and Recent Activity
      const quotesRes = await this.quoteService.listQuotations({
        user_id: userId,
        user_type: 'customer',
        limit: 5,
        offset: 0
      }).toPromise();

      const quotes = quotesRes?.result?.data || quotesRes?.data || [];
      this.recentQuotes = quotes;
      this.stats.pendingQuotes = quotes.filter((q: any) => q.stage_name !== 'Won' && q.stage_name !== 'Lost').length; // Approximation

      // Fetch Policies Count
      const policiesRes = await this.api.get('/v1/policy/list-policies', {
        params: { user_id: userId, user_type: 'customer', limit: 1, offset: 0 }
      }).toPromise() as any;
      this.stats.activePolicies = policiesRes?.result?.total_count || policiesRes?.total_count || 0;

      // Fetch Claims Count
      const claimsRes = await this.api.get('/v1/claim/list-claims', {
        params: { user_id: userId, user_type: 'customer', limit: 1, offset: 0 }
      }).toPromise() as any;
      this.stats.openClaims = claimsRes?.result?.total_count || claimsRes?.total_count || 0;

    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      this.loading = false;
    }
  }
}
