import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { SurveyorService } from '../../../core/services/surveyor.service';

interface ExclusionType {
    name: string;
    code: string;
}

interface Exclusion {
    exclusion_name: string;
    exclusion_types: ExclusionType[];
}

@Component({
    selector: 'app-survey-exclusions',
    standalone: true,
    imports: [CommonModule, SharedModule],
    templateUrl: './survey-exclusions.component.html',
    styleUrls: ['./survey-exclusions.component.css']
})
export class SurveyExclusionsComponent implements OnInit {
    @Output() exclusionsChanged = new EventEmitter<any[]>();

    exclusions: Exclusion[] = [];
    loading: boolean = true;

    // Map of exclusion_name -> Set of selected type codes
    selectedExclusions = new Map<string, Set<string>>();

    constructor(private surveyorService: SurveyorService) { }

    ngOnInit(): void {
        this.loadExclusions();
    }

    loadExclusions(): void {
        this.loading = true;
        this.surveyorService.getExclusions().subscribe({
            next: (response) => {
                // Handle different response structures if needed, similar to listSurveys
                this.exclusions = Array.isArray(response) ? response : (response.data || []);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading exclusions:', err);
                this.loading = false;
            }
        });
    }

    toggleExclusion(exclusionName: string, typeCode: string): void {
        if (!this.selectedExclusions.has(exclusionName)) {
            this.selectedExclusions.set(exclusionName, new Set());
        }

        const types = this.selectedExclusions.get(exclusionName)!;
        if (types.has(typeCode)) {
            types.delete(typeCode);
            if (types.size === 0) {
                this.selectedExclusions.delete(exclusionName);
            }
        } else {
            types.add(typeCode);
        }

        this.emitChanges();
    }

    isSelected(exclusionName: string, typeCode: string): boolean {
        return this.selectedExclusions.get(exclusionName)?.has(typeCode) ?? false;
    }

    getSelectedCount(): number {
        let count = 0;
        this.selectedExclusions.forEach(types => count += types.size);
        return count;
    }

    private emitChanges(): void {
        const result: any[] = [];
        this.selectedExclusions.forEach((codes, name) => {
            if (codes.size > 0) {
                result.push({
                    exclusion_name: name,
                    exclusion_type_codes: Array.from(codes)
                });
            }
        });
        this.exclusionsChanged.emit(result);
    }
}
