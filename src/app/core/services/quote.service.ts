import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface QuoteListParams {
    user_id: number;
    user_type: string;
    limit?: number;
    offset?: number;
    domain?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class QuoteService {

    constructor(private api: ApiService) { }

    /**
     * List Quotations
     */
    listQuotations(params: QuoteListParams): Observable<any> {
        const domainStr = Array.isArray(params.domain)
            ? JSON.stringify(params.domain)
            : params.domain || '[]';

        return this.api.get('/v1/quote/list-quotations', {
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
     * Request Quotation - Matches React app's requestQuotation method
     */
    requestQuotation(quoteData: any): Observable<any> {
        return this.api.post('/v1/crm/request-quotation', {
            params: {
                data: quoteData
            }
        }).pipe(map(res => res));
    }

    /**
     * Generate Proposals - Matches React app's generateProposals method
     */
    generateProposals(opportunityId: number): Observable<any> {
        return this.api.post('/v1/crm/generate-opportunity-proposals', {
            params: {
                opportunity_id: opportunityId
            }
        }).pipe(map(res => res));
    }

    /**
     * Get Proposals - Matches React app's getProposals method
     */
    getProposals(opportunityId: number): Observable<any> {
        return this.api.get(`/v1/crm/get-crm-proposals?opportunity_id=${opportunityId}`)
            .pipe(map(res => res));
    }

    /**
     * Get Vehicle Makers - Matches React app's getVehicleMakers method
     */
    getVehicleMakers(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-makers').pipe(map(res => res));
    }

    /**
     * Get Vehicle Models - Matches React app's getVehicleModels method
     */
    getVehicleModels(makerCode: string): Observable<any> {
        return this.api.get(`/v1/lov/vehicle-models?maker_code=${encodeURIComponent(makerCode)}`)
            .pipe(map(res => res));
    }

    /**
     * Get Vehicle Model Categories - Matches React app's getVehicleModelCategories method
     */
    getVehicleModelCategories(modelCode: string): Observable<any> {
        return this.api.get(`/v1/lov/vehicle-model-categories?model_code=${encodeURIComponent(modelCode)}`)
            .pipe(map(res => res));
    }

    /**
     * Get Vehicle Model Years - Matches React app's getVehicleModelYears method
     */
    getVehicleModelYears(modelId: string): Observable<any> {
        return this.api.get(`/v1/lov/vehicle-model-years?model_id=${encodeURIComponent(modelId)}`)
            .pipe(map(res => res));
    }

    /**
     * Get Vehicle Body Types - Matches React app's getVehicleBodyTypes method
     */
    getVehicleBodyTypes(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-body-types').pipe(map(res => res));
    }

    /**
     * Get Vehicle Usages - Matches React app's getVehicleUsages method
     */
    getVehicleUsages(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-usages').pipe(map(res => res));
    }

    /**
     * Get Vehicle CCs - Matches React app's getVehicleCcs method
     */
    getVehicleCcs(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-ccs').pipe(map(res => res));
    }

    /**
     * Get Vehicle Fuel Types - Matches React app's getVehicleFuelTypes method
     */
    getVehicleFuelTypes(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-fuel-types').pipe(map(res => res));
    }

    /**
     * Get Vehicle Colors - Matches React app's getVehicleColors method
     */
    getVehicleColors(): Observable<any> {
        return this.api.get('/v1/lov/vehicle-colors').pipe(map(res => res));
    }

    /**
     * Get Road Side Programs - Matches React app's getRoadSidePrograms method
     */
    getRoadSidePrograms(): Observable<any> {
        return this.api.get('/v1/lov/road-side-programs').pipe(map(res => res));
    }

    /**
     * Get Insurance Issuing Types - Matches React app's getInsuranceIssuingTypes method
     */
    getInsuranceIssuingTypes(): Observable<any> {
        return this.api.get('/v1/lov/insurance-issuing-types').pipe(map(res => res));
    }

    /**
     * Download Proposal PDF - Matches React app's downloadProposalPdf method
     */
    downloadProposalPdf(proposalId: number): Observable<Blob> {
        return this.api.get<Blob>(`/v1/crm/download-proposal-pdf?proposal_id=${proposalId}`, {
            responseType: 'blob' as 'json'
        });
    }

    /**
     * Request Issuance - Matches React app's requestIssuance method
     */
    requestIssuance(issuanceData: any): Observable<any> {
        return this.api.post('/v1/crm/request-issuance', {
            params: {
                data: issuanceData
            }
        }).pipe(map(res => res));
    }

    /**
     * Get CRM Documents - Matches React app's getCRMDocuments method
     */
    getCRMDocuments(): Observable<any> {
        return this.api.get('/v1/lov/crm-documents').pipe(map(res => res));
    }

    /**
     * Get Payment Methods - Matches React app's getPaymentMethods method
     */
    getPaymentMethods(): Observable<any> {
        return this.api.get('/v1/lov/payment-methods').pipe(map(res => res));
    }
}
