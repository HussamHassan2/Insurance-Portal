import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    get<T>(endpoint: string, options?: any): Observable<T> {
        const url = this.baseUrl + endpoint;
        return this.http.get<T>(url, options) as Observable<T>;
    }

    post<T>(endpoint: string, body: any, options?: any): Observable<T> {
        const url = this.baseUrl + endpoint;
        return this.http.post<T>(url, body, options) as Observable<T>;
    }

    put<T>(endpoint: string, body: any, options?: any): Observable<T> {
        const url = this.baseUrl + endpoint;
        return this.http.put<T>(url, body, options) as Observable<T>;
    }

    delete<T>(endpoint: string, options?: any): Observable<T> {
        const url = this.baseUrl + endpoint;
        return this.http.delete<T>(url, options) as Observable<T>;
    }

    patch<T>(endpoint: string, body: any, options?: any): Observable<T> {
        const url = this.baseUrl + endpoint;
        return this.http.patch<T>(url, body, options) as Observable<T>;
    }
}
