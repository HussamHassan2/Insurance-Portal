import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ClaimListParams {
    user_id: number;
    user_type: string;
    limit?: number;
    offset?: number;
    domain?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class ClaimService {

    constructor(private api: ApiService) { }

    /**
     * List Claims - Matches React app's listClaims method
     */
    listClaims(params: ClaimListParams): Observable<any> {
        const domainStr = Array.isArray(params.domain)
            ? JSON.stringify(params.domain)
            : params.domain || '[]';

        return this.api.get('/v1/claim/list-claims', {
            params: {
                user_id: params.user_id,
                user_type: params.user_type,
                limit: params.limit,
                offset: params.offset,
                domain: domainStr
            }
        });
    }

    /**
     * Get Claim Details - Matches React app's getClaim method
     */
    getClaim(claimId: number): Observable<any> {
        return this.api.get('/v1/claim/get-claim-details', {
            params: { claim_id: claimId }
        });
    }

    /**
     * Create Claim Intimation - Matches React app's createClaimIntimation method
     */
    createClaimIntimation(claimData: any): Observable<any> {
        if (claimData instanceof FormData) {
            return this.api.post('/v1/claim/create-claim-intimation', claimData);
        }
        return this.api.post('/v1/claim/create-claim-intimation', {
            params: claimData
        });
    }

    /**
     * Check Risk Availability - Matches React app's checkRiskAvailability method
     */
    checkRiskAvailability(chassisNumber: string, userId: number, lossDate: string): Observable<any> {
        return this.api.post('/v1/claim/check-risk-availability', {
            params: {
                chassis_number: chassisNumber,
                user_id: userId,
                loss_date: lossDate
            }
        });
    }

    /**
     * Get Workshops List
     */
    getWorkshops(limit: number = 10, offset: number = 0, domain: any[] = []): Observable<any> {
        return this.api.get('/v1/workshop/list-workshops', {
            params: {
                limit: limit,
                offset: offset,
                domain: JSON.stringify(domain)
            }
        });
    }

    /**
     * Get Claim Documents List
     */
    getClaimDocuments(): Observable<any> {
        return this.api.get('/v1/lov/claim-documents');
    }
}
