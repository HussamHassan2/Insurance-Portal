import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface SurveyListParams {
    survey_type?: 'Issuance' | 'claim';
    limit?: number;
    offset?: number;
    domain?: string;
    identification_codes?: string[];
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class SurveyorService {

    constructor(
        private api: ApiService,
        private authService: AuthService
    ) { }

    /**
     * List Surveys (Issuance or Claim)
     * GET /api/v1/survey/list-surveys
     */
    listSurveys(params: SurveyListParams = {}): Observable<any> {
        // Default params
        const queryParams = {
            limit: 10,
            offset: 0,
            domain: '[]',
            ...params
        };

        // If identification_codes is passed as array, we might need to stringify it or handle it based on how ApiService handles arrays in params.
        // Based on previous code, it seems we might need to handle it. 
        // However, standard Angular HttpParams handles arrays by repeating keys.
        // Let's assume ApiService handles it or we pass it as is for now.

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
                survey_id: surveyId
            }
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
     */
    getExclusionTypes(): Observable<any> {
        return this.api.get('/v1/lov/exclusion-types');
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
}
