import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

interface NavItem {
    name: string;
    path: string;
    icon: string;
}

import { SurveyorService } from '../../../core/services/surveyor.service';

@Component({
    selector: 'app-dashboard-layout',
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
    user: User | null = null;
    isSidebarOpen = false; // Mobile toggle
    isCollapsed = true; // Desktop minimize
    isNotificationsOpen = false;
    isUserMenuOpen = false;
    currentPath = '';
    navItems: NavItem[] = [];

    constructor(
        private authService: AuthService,
        private router: Router,
        public translate: TranslateService,
        private surveyorService: SurveyorService
    ) {
        // Subscribe to route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentPath = event.url;
        });
    }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            this.navItems = this.getNavItems();
        });
        this.currentPath = this.router.url;
    }

    getNavItems(): NavItem[] {
        const basePath = this.getDashboardPath();
        const common: NavItem[] = [
            { name: 'APP.SUPPORT', path: '/support', icon: 'help-circle' },
            { name: 'APP.SETTINGS', path: `${basePath}/settings`, icon: 'settings' }
        ];

        switch (this.user?.role) {
            case 'customer':
                return [
                    { name: 'SIDEBAR.OVERVIEW', path: '/dashboard/customer', icon: 'layout-dashboard' },
                    { name: 'SIDEBAR.ANALYTICS', path: '/dashboard/analytics', icon: 'bar-chart-3' },
                    { name: 'SIDEBAR.POLICIES', path: '/dashboard/customer/policies', icon: 'shield' },
                    { name: 'SIDEBAR.CLAIMS', path: '/dashboard/customer/claims', icon: 'file-text' },
                    { name: 'SIDEBAR.QUOTATIONS', path: '/dashboard/customer/quotations', icon: 'scroll-text' },
                    { name: 'SIDEBAR.PAYMENTS', path: '/dashboard/customer/payments', icon: 'credit-card' },
                    ...common
                ];
            case 'broker':
                return [
                    { name: 'SIDEBAR.OVERVIEW', path: '/dashboard/broker', icon: 'layout-dashboard' },
                    { name: 'SIDEBAR.ANALYTICS', path: '/dashboard/analytics', icon: 'bar-chart-3' },
                    { name: 'SIDEBAR.QUOTATIONS', path: '/dashboard/broker/quotations', icon: 'scroll-text' },
                    { name: 'SIDEBAR.BROKER_POLICIES', path: '/dashboard/broker/policies', icon: 'shield' },
                    { name: 'SIDEBAR.CLAIMS', path: '/dashboard/broker/claims', icon: 'file-text' },
                    { name: 'SIDEBAR.PAYMENTS', path: '/dashboard/broker/premiums', icon: 'credit-card' },
                    { name: 'SIDEBAR.COMMISSIONS', path: '/dashboard/broker/commissions', icon: 'pie-chart' },
                    { name: 'SIDEBAR.CLIENTS', path: '/dashboard/broker/clients', icon: 'users' },
                    ...common
                ];
            case 'admin':
                return [
                    { name: 'SIDEBAR.OVERVIEW', path: '/dashboard/admin', icon: 'layout-dashboard' },
                    { name: 'SIDEBAR.USERS', path: '/dashboard/admin/users', icon: 'users' },
                    { name: 'SIDEBAR.REPORTS', path: '/dashboard/admin/reports', icon: 'pie-chart' },
                    ...common
                ];
            case 'surveyor':
                return [
                    { name: 'SIDEBAR.OVERVIEW', path: '/dashboard/surveyor', icon: 'layout-dashboard' },
                    { name: 'SIDEBAR.PENDING_SURVEYS', path: '/dashboard/surveyor/pending', icon: 'clock' },
                    ...common
                ];
            default:
                return common;
        }
    }

    handleLogout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    toggleSidebar(): void {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    closeSidebar(): void {
        this.isSidebarOpen = false;
    }

    toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
    }

    toggleNotifications(): void {
        this.isNotificationsOpen = !this.isNotificationsOpen;
    }

    toggleUserMenu(): void {
        this.isUserMenuOpen = !this.isUserMenuOpen;
    }

    isActive(path: string): boolean {
        return this.currentPath === path;
    }

    getUserAvatar(): string {
        return '';
    }

    getCurrentDate(): string {
        const lang = this.translate.currentLang || 'en';
        const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
        return new Date().toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getDashboardPath(): string {
        switch (this.user?.role) {
            case 'broker':
                return '/dashboard/broker';
            case 'admin':
                return '/dashboard/admin';
            case 'surveyor':
                return '/dashboard/surveyor';
            default:
                return '/dashboard/customer';
        }
    }

    handleLogoClick(event: Event): void {
        if (this.user?.role === 'surveyor') {
            event.preventDefault();
            this.router.navigate(['/dashboard/surveyor'], {
                queryParams: { wizard: 'true' }
            });
        }
    }
}
