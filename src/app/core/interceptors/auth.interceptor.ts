import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Add auth token to request headers - matches React app's api.js interceptor
        const token = this.authService.getToken();

        console.log(`[AuthInterceptor] Intercepting request to: ${request.url}`);

        if (token) {
            console.log('[AuthInterceptor] Token found, adding Authorization header');
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        } else {
            console.warn('[AuthInterceptor] No token found in AuthService');
        }

        // Handle response errors - matches React app's error handling
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Handle 401 Unauthorized - matches React app's 401 handling
                if (error.status === 401) {
                    // Clear token and redirect to login
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }

                return throwError(() => error);
            })
        );
    }
}
