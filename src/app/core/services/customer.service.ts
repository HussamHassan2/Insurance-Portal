import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    constructor(private api: ApiService) { }

    /**
     * Get Customer Info - Matches React app's getCustomerInfo method
     */
    getCustomerInfo(userId: number): Observable<any> {
        return this.api.get('/v1/customer/info', {
            params: { user_id: userId }
        });
    }

    /**
     * Search Partners/Customers - Matches React app's searchPartners method
     */
    searchPartners(queryParams: any): Observable<any> {
        return this.api.get('/v1/partner/search/', {
            params: queryParams
        });
    }

    /**
     * Create Partner/Customer - Matches React app's createPartner method
     */
    createPartner(data: any): Observable<any> {
        return this.api.post('/v1/partner/register-portal-user', {
            params: data
        });
    }

    /**
     * Search Customers - Matches React app's searchCustomers method
     */
    searchCustomers(params: any): Observable<any> {
        return this.api.get('/v1/partner/search/', {
            params: params
        });
    }

    /**
     * Get Broker's Customers List - Matches React app's getCustomers method
     */
    getCustomers(userId: number, userType: string = 'broker', additionalParams: any = {}): Observable<any> {
        return this.api.get('/v1/partner/get-customers', {
            params: {
                user_type: userType,
                user_id: userId,
                ...additionalParams
            }
        });
    }
}
