import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const clonedReq = request.clone({
            setHeaders: {
                'X-Tenant-ID': environment.clientId,
                'X-Client-Version': '1.0.0'
            }
        });

        return next.handle(clonedReq);
    }
}
