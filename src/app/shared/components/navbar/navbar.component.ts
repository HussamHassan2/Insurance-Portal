import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    isOpen = false;
    user: User | null = null;
    clientId = environment.clientId;

    navLinks = [
        { name: 'MENU.HOME', path: '/' },
        { name: 'MENU.SERVICES', path: '/services' },
        { name: 'MENU.CLAIMS_PUBLIC', path: '/claims' },
        { name: 'MENU.CONTACT', path: '/contact' }
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private translateService: TranslateService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('NavbarComponent initialized');
        console.log('clientId:', this.clientId);
        console.log('navLinks:', this.navLinks);

        // Subscribe to user changes
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            console.log('Current user:', user);
        });

        // Force initial change detection after a short delay to ensure translations are loaded
        setTimeout(() => {
            this.cdr.detectChanges();
        }, 100);

        // Subscribe to translation changes to trigger change detection
        this.translateService.onLangChange.subscribe(() => {
            this.cdr.detectChanges();
        });
        this.translateService.onDefaultLangChange.subscribe(() => {
            this.cdr.detectChanges();
        });
    }

    toggleMenu(): void {
        this.isOpen = !this.isOpen;
    }

    closeMenu(): void {
        this.isOpen = false;
    }

    getDashboardLink(): string {
        if (!this.user) return '/login';
        switch (this.user.role) {
            case 'broker': return '/dashboard/broker';
            case 'admin': return '/dashboard/admin';
            case 'surveyor': return '/dashboard/surveyor';
            default: return '/dashboard/customer';
        }
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
