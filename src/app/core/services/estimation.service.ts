import { Injectable } from '@angular/core';
import { SurveyStateService } from './survey-state.service';
import { map } from 'rxjs/operators';

export interface EstimationLine {
    id: number;
    part_name: string;
    repair_type: string;
    cost: number;
    // Add more fields as needed based on API response
}

@Injectable({
    providedIn: 'root'
})
export class EstimationService {

    constructor(private surveyState: SurveyStateService) { }

    /**
     * Get estimations from the current active survey in state
     */
    getEstimations() {
        return this.surveyState.state$.pipe(
            map(state => state.currentSurvey?.assigned_estimation?.estimation_lines || [])
        );
    }

    // Future methods for calculating totals, variances, etc.
}
