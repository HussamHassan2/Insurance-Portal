import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface SurveyListParams {
    survey_type?: string;
    limit?: number;
    offset?: number;
    domain?: string;
    [key: string]: any;
}

export interface SurveyPhoto {
    name: string;
    data: string; // Base64
}

@Injectable({
    providedIn: 'root'
})
export class SurveyorService {
    // Subject to trigger opening the wizard from other components
    private openWizardSource = new Subject<void>();
    openWizard$ = this.openWizardSource.asObservable();

    constructor(
        private api: ApiService,
        private authService: AuthService
    ) { }

    triggerOpenWizard() {
        this.openWizardSource.next();
    }

    /**
     * Get identification codes from current user
     */
    private getIdentificationCodes(): string {
        const user = this.authService.currentUserValue;
        if (user && user.id) {
            return JSON.stringify([user.id.toString()]);
        }
        return '[]';
    }

    /**
     * List Issuance Surveys
     */
    listSurveys(params?: SurveyListParams): Observable<any> {
        // Ensure default params for issuance
        const queryParams = {
            survey_type: 'issuance',
            limit: 10,
            offset: 0,
            domain: '[]',
            identification_codes: this.getIdentificationCodes(),
            ...params
        };

        return this.api.get('/v1/survey/list-surveys', {
            params: queryParams
        });
    }

    /**
     * Get Survey Details
     */
    getSurveyDetails(surveyId: number | string, identificationCode?: string): Observable<any> {
        // Use provided code or fallback to user ID
        const codes = identificationCode
            ? JSON.stringify([identificationCode])
            : this.getIdentificationCodes();

        return this.api.get('/v1/survey/get-survey', {
            params: {
                survey_id: surveyId,
                identification_codes: codes
            }
        });
    }

    /**
     * Update Survey Status
     */
    updateSurveyStatus(data: { survey_id: number; status: string; notes?: string }): Observable<any> {
        return this.api.post('/v1/survey/update-survey-status', {
            params: data
        });
    }

    /**
     * Upload Survey Photos
     */
    uploadSurveyPhotos(surveyId: string | number, photos: SurveyPhoto[]): Observable<any> {
        return this.api.post('/v1/survey/upload-survey-photos', {
            params: {
                survey_id: surveyId,
                photos: photos
            }
        });
    }

    /**
     * List Surveyor Claims
     */
    listClaims(params?: SurveyListParams): Observable<any> {
        // Ensure default params for claims
        const queryParams = {
            survey_type: 'claim',
            limit: 10,
            offset: 0,
            domain: '[]',
            identification_codes: this.getIdentificationCodes(),
            ...params
        };

        return this.api.get('/v1/survey/list-surveys', {
            params: queryParams
        });
    }

    /**
     * Get Claim Details
     */
    getClaimDetails(claimId: number | string, identificationCode?: string): Observable<any> {
        // Use generic endpoint filtering by ID
        return this.api.get('/v1/survey/get-survey', {
            params: {
                survey_id: claimId,
                // identification_code might be needed if the API supports it
            }
        });
    }
}
