import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantConfig {
    id: string;
    name: string;
    features: string[];
    portfolio: Array<{
        id: string;
        title: string;
        description: string;
        imageUrl: string;
        category: string;
    }>;
    settings: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
    private configSubject = new BehaviorSubject<TenantConfig | null>(null);
    public config$ = this.configSubject.asObservable();

    constructor(private http: HttpClient) { }

    loadConfig(): Observable<TenantConfig> {
        const url = `${environment.apiUrl}/tenants/${environment.clientId}`;

        return this.http.get<TenantConfig>(url).pipe(
            tap(config => {
                this.configSubject.next(config);
                console.log('Tenant config loaded:', config.name);
            })
        );
    }

    getConfig(): TenantConfig | null {
        return this.configSubject.value;
    }

    hasFeature(featureName: string): boolean {
        const config = this.getConfig();
        return config?.features?.includes(featureName) ?? false;
    }

    getClientId(): string {
        return environment.clientId;
    }
}
