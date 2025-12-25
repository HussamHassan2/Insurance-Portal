import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SurveyState {
    currentSurvey: any | null;
    formData: any;
    isWizardOpen: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SurveyStateService {
    private initialState: SurveyState = {
        currentSurvey: null,
        formData: {},
        isWizardOpen: false
    };

    private state = new BehaviorSubject<SurveyState>(this.initialState);
    state$ = this.state.asObservable();

    constructor() {
        // Load state from local storage on init if needed
        const savedState = localStorage.getItem('surveyRequiredState');
        if (savedState) {
            // Restore logic can go here, but be careful with stale data
            // this.state.next(JSON.parse(savedState));
        }
    }

    setSurvey(survey: any) {
        this.updateState({ currentSurvey: survey, formData: {} }); // Reset form data on new survey
    }

    updateFormData(data: any) {
        const current = this.state.value;
        const newData = { ...current.formData, ...data };
        this.updateState({ formData: newData });
    }

    openWizard() {
        this.updateState({ isWizardOpen: true });
    }

    closeWizard() {
        this.updateState({ isWizardOpen: false });
    }

    clearState() {
        this.state.next(this.initialState);
        localStorage.removeItem('surveyRequiredState');
    }

    private updateState(newState: Partial<SurveyState>) {
        const current = this.state.value;
        const next = { ...current, ...newState };
        this.state.next(next);
        // Auto-save logic
        if (next.currentSurvey) {
            localStorage.setItem(`survey_draft_${next.currentSurvey.id}`, JSON.stringify(next.formData));
        }
    }

    loadDraft(surveyId: any) {
        const draft = localStorage.getItem(`survey_draft_${surveyId}`);
        if (draft) {
            const formData = JSON.parse(draft);
            this.updateFormData(formData);
        }
    }
}
