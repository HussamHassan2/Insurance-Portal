import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PolicyListParams {
    user_id: number;
    user_type: string;
    limit?: number;
    offset?: number;
    domain?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class PolicyService {

    constructor(private api: ApiService) { }

    /**
     * List Policies - Matches React app's listPolicies method
     */
    listPolicies(params: PolicyListParams): Observable<any> {
        const domainStr = Array.isArray(params.domain)
            ? JSON.stringify(params.domain)
            : params.domain || '[]';

        const apiParams: any = {
            user_id: params.user_id,
            user_type: params.user_type,
            domain: domainStr
        };

        // Only include limit and offset if they are defined
        if (params.limit !== undefined) {
            apiParams.limit = params.limit;
        }
        if (params.offset !== undefined) {
            apiParams.offset = params.offset;
        }

        return this.api.get('/v1/policy/list-policies', {
            params: apiParams
        });
    }

    /**
     * Get Policy Details - Matches React app's getPolicy method
     */
    getPolicy(policyId: number): Observable<any> {
        return this.api.get('/v1/crm/get-policy', {
            params: { policy_id: policyId }
        });
    }

    /**
     * Download Policy PDF - Matches React app's downloadPolicyPdf method
     */
    downloadPolicyPdf(policyId: number): Observable<Blob> {
        return this.api.get<Blob>(`/v1/crm/download-policy-pdf?policy_id=${policyId}`, {
            responseType: 'blob' as 'json'
        });
    }

    /**
     * Renew Policy - Matches React app's renewPolicy method
     */
    renewPolicy(policyNumber: string): Observable<any> {
        return this.api.post('/v1/policy/renewal', {
            params: {
                data: {
                    policy_number: policyNumber
                }
            }
        });
    }
}
