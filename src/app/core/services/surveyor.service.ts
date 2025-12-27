import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface SurveyListParams {
    survey_type?: 'Issuance' | 'claim';
    limit?: number;
    offset?: number;
    domain?: string;
    identification_codes?: any; // Changed to any to accept string or string[] to fix TS error
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class SurveyorService {
    // Subject to trigger opening the wizard from other components - Restoring for Dashboard compatibility
    // private openWizardSource = new Subject<void>();   // If needed by other parts not yet refactored
    // openWizard$ = this.openWizardSource.asObservable();

    constructor(
        private api: ApiService,
        private authService: AuthService
    ) { }

    /**
     * Helper to get identification codes from Auth Service
     */
    private getIdentificationCodes(): string {
        const user = this.authService.currentUserValue;
        if (user && user.identification_code) {
            return JSON.stringify([user.identification_code]);
        }
        return '[]';
    }

    /**
     * List Surveys (Issuance or Claim)
     * GET /api/v1/survey/list-surveys
     */
    listSurveys(params: SurveyListParams = {}): Observable<any> {
        // Default params
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
     * GET /api/v1/survey/get-survey
     */
    getSurveyDetails(surveyId: number | string): Observable<any> {
        return this.api.get('/v1/survey/get-survey', {
            params: {
                survey_id: surveyId,
                identification_codes: this.getIdentificationCodes()
            }
        });
    }

    /**
     * List Surveyor Claims (Alias for listSurveys with claim type)
     */
    listClaims(params: SurveyListParams = {}): Observable<any> {
        return this.listSurveys({ ...params, survey_type: 'claim' });
    }

    /**
     * Accept Survey
     */
    acceptSurvey(surveyId: number | string): Observable<any> {
        return this.api.post('/v1/survey/accept', {
            params: { survey_id: surveyId }
        });
    }

    /**
     * Suspend Survey
     */
    suspendSurvey(surveyId: number | string): Observable<any> {
        return this.api.post('/v1/survey/suspend', {
            params: { survey_id: surveyId }
        });
    }

    /**
     * Reject Survey
     */
    rejectSurvey(surveyId: number | string): Observable<any> {
        return this.api.post('/v1/survey/reject', {
            params: { survey_id: surveyId }
        });
    }

    /**
     * Submit Survey
     * POST /api/v1/survey/submit
     */
    submitSurvey(data: {
        survey_id: number;
        recommendation: string;
        car_condition: string;
        conclusion: string;
        market_value: number;
        number_of_kilometers: number;
        zero_price: number;
        survey_exclusions: any[];
        survey_documents: any[];
    }): Observable<any> {
        return this.api.post('/v1/survey/submit', {
            params: data
        });
    }

    /**
     * Get Survey Exclusion Types
     * GET /api/v1/lov/exclusion-types
     * Aliased as getExclusions for compatibility
     */
    getExclusions(): Observable<any> {
        return this.api.get('/v1/policy/exclusions');
    }

    getExclusionTypes(): Observable<any> {
        return this.getExclusions();
    }

    /**
     * Get Survey Document Lines (Types)
     * GET /api/v1/lov/survey-document-lines
     */
    getSurveyDocumentTypes(): Observable<any> {
        return this.api.get('/v1/lov/survey-document-lines');
    }

    /**
     * Get Issuance Survey Types
     * GET /api/v1/lov/issuance-survey-types
     */
    getIssuanceSurveyTypes(): Observable<any> {
        return this.api.get('/v1/lov/issuance-survey-types');
    }

    /**
     * Update Survey Documents (Independent of submit if needed)
     * POST /api/v1/survey/docs/update
     */
    updateSurveyDocuments(data: { line_id: number; comment: string }): Observable<any> {
        return this.api.post('/v1/survey/docs/update', {
            params: data
        });
    }

    /**
     * Create Survey Estimation Lines
     * POST /v1/survey/create-survey-estimation-lines
     */
    createSurveyEstimationLines(data: { survey_id: number, estimation_lines: any[] }): Observable<any> {
        return this.api.post('/v1/survey/create-survey-estimation-lines', {
            params: data
        });
    }

    /**
     * Update Survey Estimation Lines
     * POST /v1/survey/update-survey-estimation-lines
     */
    updateSurveyEstimationLines(data: { survey_id: number, estimation_lines: any[] }): Observable<any> {
        return this.api.post('/v1/survey/update-survey-estimation-lines', {
            params: data
        });
    }
}
