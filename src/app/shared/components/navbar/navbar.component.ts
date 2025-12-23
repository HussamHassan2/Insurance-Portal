import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

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

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit(): void {
        console.log('NavbarComponent initialized');
        console.log('clientId:', this.clientId);
        console.log('navLinks:', this.navLinks);
        this.authService.currentUser.subscribe(user => {
            this.user = user;
            console.log('Current user:', user);
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
