import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface EndorsementType {
    id: number;
    code: string;
    name: string;
}

export interface EndorsementReason {
    id: number;
    name: string;
    title?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EndorsementService {

    constructor(private api: ApiService) { }

    /**
     * Get Endorsement Types - Matches React app's getEndorsementTypes method
     */
    getEndorsementTypes(): Observable<EndorsementType[]> {
        return this.api.get<any>('/v1/lov/endorsement-sub-types').pipe(
            map(response => {
                // Check specifically for the key 'endorsement_sub_types' as per API response
                const data = response?.endorsement_sub_types ||
                    response?.result?.endorsement_sub_types ||
                    response?.result?.data ||
                    response?.data ||
                    [];

                return data.map((item: any) => ({
                    id: item.id,
                    code: item.code || item.sequence_number,
                    name: item.name || item.item
                }));
            }),
            catchError(error => {
                console.error('Failed to fetch endorsement types', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get Endorsement Reasons - Matches React app's getEndorsementReasons method
     */
    getEndorsementReasons(subTypeCode: string): Observable<EndorsementReason[]> {
        return this.api.get<any>('/v1/get-endorsement-subtype-reasons', {
            params: { end_subtype_seq_number: subTypeCode }
        }).pipe(
            map(response => {
                // Try plausible keys for reasons, fallback to standard structures
                const data = response?.endorsement_sub_type_reasons ||
                    response?.endorsement_subtype_reasons ||
                    response?.endorsement_reasons ||
                    response?.reasons ||
                    response?.result?.data ||
                    response?.data ||
                    [];

                return data.map((item: any) => ({
                    id: item.id,
                    name: item.name || item.item,
                    title: item.title
                }));
            }),
            catchError(error => {
                console.error('Failed to fetch endorsement reasons', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Create Endorsement - Matches React app's createEndorsement method
     */
    createEndorsement(payload: any): Observable<boolean> {
        return this.api.post<any>('/v1/policy/endorsement', payload).pipe(
            map(response => {
                return response;
            }),
            catchError(error => {
                console.error('Failed to create endorsement', error);
                return throwError(() => error);
            })
        );
    }
}
