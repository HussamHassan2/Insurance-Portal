import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface OpportunityListParams {
    user_id: number;
    user_type: string;
    limit?: number;
    offset?: number;
    domain?: any[] | string;
}

export interface ChatterAttachment {
    name: string;
    datas: string; // Base64 encoded
    mimetype: string;
}

@Injectable({
    providedIn: 'root'
})
export class CrmService {

    constructor(private api: ApiService, private http: HttpClient) { }

    /**
     * Get Opportunity Details - Matches React app's getOpportunity method
     */
    getOpportunity(opportunityId: number): Observable<any> {
        return this.api.get('/v1/crm/get-opportunity', {
            params: { opportunity_id: opportunityId }
        });
    }

    /**
     * Get Quotation Details - Alias for getOpportunity
     */
    getQuotation(quotationId: number): Observable<any> {
        return this.getOpportunity(quotationId);
    }

    /**
     * List Opportunities - Matches React app's listOpportunities method
     */
    listOpportunities(params: OpportunityListParams): Observable<any> {
        const domainStr = Array.isArray(params.domain)
            ? JSON.stringify(params.domain)
            : params.domain;

        return this.api.get('/v1/crm/list-opportunities', {
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
     * Get Renewal Requests - Matches React app's getRenewalRequests method
     */
    getRenewalRequests(params: any): Observable<any> {
        return this.api.get('/v1/crm/get-renewal-requests', {
            params: params
        });
    }

    /**
     * Request Policy Info - Matches React app's requestPolicyInfo method
     */
    requestPolicyInfo(opportunityId: number): Observable<any> {
        return this.api.get('/v1/crm/request-policy-info', {
            params: { opportunity_id: opportunityId }
        });
    }

    /**
     * Get Proposals - Matches React app's getProposals method
     */
    getProposals(opportunityId: number): Observable<any> {
        return this.api.get('/v1/crm/get-crm-proposals', {
            params: { opportunity_id: opportunityId }
        });
    }

    /**
     * Download Proposal PDF - Matches React app's downloadProposal method
     * Handles Base64 to Blob conversion
     */
    downloadProposal(proposalId: number): Observable<Blob> {
        const token = localStorage.getItem('authToken');

        return this.api.get<any>('/v1/crm/download-proposal-pdf', {
            params: { proposal_id: proposalId },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
            map(response => {
                // Extract Base64 string from response
                const base64String = response?.result?.data || response?.data || response?.result || response;

                if (typeof base64String === 'string') {
                    const cleanB64 = base64String.replace(/\s/g, '');
                    return this.b64toBlob(cleanB64, 'application/pdf');
                }

                return response;
            })
        );
    }

    /**
     * Helper to convert Base64 to Blob - Matches React app's b64toBlob function
     */
    private b64toBlob(b64Data: string, contentType: string = 'application/pdf', sliceSize: number = 512): Blob {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);

            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }

    /**
     * Get Lost Reasons - Matches React app's getLostReasons method
     */
    getLostReasons(): Observable<any> {
        return this.api.get('/v1/crm/lost-reasons', {
            params: {}
        });
    }

    /**
     * Generate Opportunity Proposals - Matches React app's generateProposals method
     */
    generateProposals(opportunityId: number): Observable<any> {
        return this.api.post('/v1/crm/generate-opportunity-proposals', {
            params: { opportunity_id: opportunityId }
        });
    }

    /**
     * Request Issuance - Matches React app's requestIssuance method
     */
    requestIssuance(data: any): Observable<any> {
        return this.api.post('/v1/crm/request-issuance', {
            params: { data: data }
        });
    }

    /**
     * Request Quotation - Matches React app's requestQuotation method
     */
    requestQuotation(data: any): Observable<any> {
        return this.api.post('/v1/crm/request-quotation', {
            params: { data: data }
        });
    }

    /**
     * Mark Opportunity as Lost - Matches React app's markLost method
     */
    markLost(opportunityId: number, lostReasonId: number, feedback: string): Observable<any> {
        return this.api.post('/v1/crm/mark-lost', {
            params: {
                opportunity_id: opportunityId,
                lost_reason_id: lostReasonId,
                lost_feedback: feedback
            }
        });
    }

    /**
     * Post Chatter Message - Matches Postman collection format
     */
    postChatterMessage(recordId: number, message: string, attachments: ChatterAttachment[] = []): Observable<any> {
        return this.api.post('/v1/post-chatter-message', {
            params: {
                is_external_message: true,
                record_id: parseInt(recordId.toString()),
                model_name: "crm.lead",
                message: message,
                attachments: attachments
            }
        });
    }
}
