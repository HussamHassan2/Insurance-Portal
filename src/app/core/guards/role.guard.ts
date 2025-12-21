import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const currentUser = this.authService.currentUserValue;

        if (!currentUser) {
            // Not logged in, redirect to login
            this.router.navigate(['/login']);
            return false;
        }

        // Check if route has role restrictions
        const allowedRoles = route.data['roles'] as Array<string>;

        if (allowedRoles && allowedRoles.length > 0) {
            // Check if user's role is in allowed roles
            if (allowedRoles.includes(currentUser.role)) {
                return true;
            }

            // Role not authorized, redirect to home
            this.router.navigate(['/']);
            return false;
        }

        // No role restrictions, allow access
        return true;
    }
}
