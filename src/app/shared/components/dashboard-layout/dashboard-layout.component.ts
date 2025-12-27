import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Title } from '@angular/platform-browser';

interface NavItem {
    name: string;
    path: string;
    icon: string;
    children?: NavItem[];
    expanded?: boolean;
}

import { SurveyorService } from '../../../core/services/surveyor.service';

@Component({
    selector: 'app-dashboard-layout',
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
    clientId = environment.clientId;
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
        private surveyorService: SurveyorService,
        private titleService: Title
    ) {
        // Subscribe to route changes
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentPath = event.url;
            this.checkActiveSubmenu();
        });
    }

    ngOnInit(): void {
        this.setWebsiteTitle();
        this.authService.currentUser.subscribe(user => {
            console.log('DashboardLayout: Current user:', user);
            this.user = user;
            this.navItems = this.getNavItems();
            console.log('DashboardLayout: Generated navItems:', this.navItems);
            this.checkActiveSubmenu();
        });
        this.currentPath = this.router.url;
    }

    setWebsiteTitle(): void {
        if (this.clientId === 'wataniya') {
            this.titleService.setTitle('Wataniya Insurance | الوطنية للتأمين');
        } else {
            this.titleService.setTitle('Orient Insurance Portal');
        }
    }

    getNavItems(): NavItem[] {
        const basePath = this.getDashboardPath();
        const common: NavItem[] = [
            { name: 'OCR Scanner', path: '/ocr', icon: 'file-text' }, // Added OCR MenuItem
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
                    {
                        name: 'SIDEBAR.QUOTATIONS',
                        path: '/dashboard/broker/quotations',
                        icon: 'scroll-text',
                        children: [
                            { name: 'SIDEBAR.ALL_QUOTATIONS', path: '/dashboard/broker/quotations', icon: 'list' },
                            { name: 'SIDEBAR.RENEWAL_REQUESTS', path: '/dashboard/broker/quotations/renewal-requests', icon: 'refresh-cw' },
                            { name: 'SIDEBAR.ENDORSEMENT_REQUESTS', path: '/dashboard/broker/quotations/endorsement-requests', icon: 'edit' },
                            { name: 'SIDEBAR.LOST_REQUESTS', path: '/dashboard/broker/quotations/lost-requests', icon: 'x-circle' }
                        ]
                    },
                    {
                        name: 'SIDEBAR.BROKER_POLICIES',
                        path: '/dashboard/broker/policies',
                        icon: 'shield',
                        children: [
                            { name: 'SIDEBAR.ALL_POLICIES', path: '/dashboard/broker/policies', icon: 'list' },
                            { name: 'SIDEBAR.DUE_RENEWAL', path: '/dashboard/broker/due-renewal-policies', icon: 'refresh-cw' }
                        ]
                    },
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
                    {
                        name: 'SIDEBAR.SURVEYS',
                        path: '/dashboard/surveyor/surveys',
                        icon: 'clipboard-list',
                        children: [
                            { name: 'SIDEBAR.PENDING_SURVEYS', path: '/dashboard/surveyor/pending', icon: 'clock' }, // stored as surveyor status
                            {
                                name: 'SIDEBAR.IN_PROGRESS',
                                path: '/dashboard/surveyor/in-progress',
                                icon: 'play-circle',
                                children: [
                                    { name: 'SIDEBAR.ISSUANCE_SURVEYS', path: '/dashboard/surveyor/in-progress/issuance', icon: 'file-plus' },
                                    { name: 'SIDEBAR.CLAIM_SURVEYS', path: '/dashboard/surveyor/in-progress/claims', icon: 'file-text' }
                                ]
                            },
                            { name: 'SIDEBAR.SUSPENDED', path: '/dashboard/surveyor/suspended', icon: 'pause-circle' }
                        ]
                    },
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

    toggleSubmenu(item: NavItem): void {
        if (item.children) {
            item.expanded = !item.expanded;
        }
    }

    checkActiveSubmenu(): void {
        this.navItems.forEach(item => {
            if (item.children) {
                // Check if any child matches current path
                const hasActiveChild = item.children.some(child => child.path === this.currentPath);
                if (hasActiveChild) {
                    item.expanded = true;
                }
            }
        });
    }

    // Flyout Submenu Logic
    hoveredItem: NavItem | null = null;
    activeSubMenuItem: NavItem | null = null;
    flyoutTop: number = 0;
    private hoverTimeout: any;

    onMouseEnter(item: NavItem, event: MouseEvent): void {

        // Calculate position for fixed flyout
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.flyoutTop = rect.top;

        if (this.isCollapsed && item.children) {
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }
            this.hoveredItem = item;
        }
    }

    onMouseLeave(item: NavItem): void {
        if (this.isCollapsed && item.children) {
            this.hoverTimeout = setTimeout(() => {
                this.hoveredItem = null;
            }, 300);
        }
    }

    onSubmenuItemClick(parent: NavItem, child: NavItem): void {
        this.activeSubMenuItem = child;
        this.hoveredItem = null;
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
    }
}
