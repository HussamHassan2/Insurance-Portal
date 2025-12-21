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
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private notificationService: NotificationService) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'An unknown error occurred!';

                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Error: ${error.error.message}`;
                } else {
                    // Server-side error
                    if (error.status === 401) {
                        // AuthInterceptor handles redirect, but we might want a toast too?
                        // Let's leave 401 to AuthInterceptor or specific handling to avoid spam.
                        // But if we want consistent toasts:
                        // errorMessage = 'Session expired or unauthorized';
                        return throwError(() => error); // Forward to let AuthInterceptor handle it if it does
                    }

                    if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    } else if (error.error && error.error.result && error.error.result.error) {
                        // Common pattern in this app based on previous file reads
                        errorMessage = error.error.result.error;
                    } else if (error.error && error.error.error) {
                        // Handle {"error": "message"} format
                        errorMessage = error.error.error;
                    } else if (typeof error.error === 'string') {
                        errorMessage = error.error;
                    } else {
                        errorMessage = error.message || `Error Code: ${error.status}`;
                    }
                }

                this.notificationService.error(errorMessage);
                return throwError(() => error);
            })
        );
    }
}
