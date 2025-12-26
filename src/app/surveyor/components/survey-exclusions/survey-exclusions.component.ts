import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { SurveyorService } from '../../../core/services/surveyor.service';

interface ExclusionType {
    name: string;
    code: string;
}

interface ApiExclusionPart {
    exclusion_name: string;
    exclusion_types: ExclusionType[];
}

interface SelectedExclusion {
    exclusion_name: string;
    exclusion_type_codes: string[]; // Selected codes
    available_types: ExclusionType[]; // All possible types for this part (from API)
}

@Component({
    selector: 'app-survey-exclusions',
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule],
    templateUrl: './survey-exclusions.component.html',
    styleUrls: ['./survey-exclusions.component.css']
})
export class SurveyExclusionsComponent implements OnInit {
    @Input() type: 'issuance' | 'claim' = 'issuance';
    @Output() exclusionsChanged = new EventEmitter<any[]>();

    allExclusionParts: ApiExclusionPart[] = [];
    filteredExclusionParts: ApiExclusionPart[] = [];
    selectedExclusions: SelectedExclusion[] = [];

    loading: boolean = true;
    showSearchModal: boolean = false;
    searchQuery: string = '';

    constructor(private surveyorService: SurveyorService) { }

    ngOnInit(): void {
        this.loadExclusions();
    }

    loadExclusions(): void {
        this.loading = true;
        this.surveyorService.getExclusions().subscribe({
            next: (response: any) => {
                // Determine if response is direct array or wrapped
                // New API structure is Array of {exclusion_name, exclusion_types}
                const apiData = Array.isArray(response) ? response : (response.data || []);

                this.allExclusionParts = apiData.map((part: any) => ({
                    exclusion_name: part.exclusion_name,
                    exclusion_types: (part.exclusion_types || []).map((t: any) => ({
                        name: t.name,
                        code: t.code
                    }))
                })).filter((part: ApiExclusionPart) =>
                    part.exclusion_name && part.exclusion_types.length > 0
                ); // Filter out invalid parts

                this.filteredExclusionParts = [...this.allExclusionParts];
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading exclusions:', err);
                this.loading = false;
            }
        });
    }

    openSearch(): void {
        this.showSearchModal = true;
        this.searchQuery = '';
        this.filteredExclusionParts = [...this.allExclusionParts];
    }

    closeSearch(): void {
        this.showSearchModal = false;
    }

    onSearch(query: string): void {
        this.searchQuery = query;
        if (!query) {
            this.filteredExclusionParts = [...this.allExclusionParts];
        } else {
            const q = query.toLowerCase();
            this.filteredExclusionParts = this.allExclusionParts.filter(part =>
                part.exclusion_name.toLowerCase().includes(q)
            );
        }
    }

    addExclusion(part: ApiExclusionPart): void {
        // Prevent duplicates
        if (!this.selectedExclusions.find(e => e.exclusion_name === part.exclusion_name)) {
            this.selectedExclusions.push({
                exclusion_name: part.exclusion_name,
                exclusion_type_codes: [], // Default none selected
                available_types: part.exclusion_types
            });
            this.emitChanges();
        }
        this.closeSearch();
    }

    removeExclusion(index: number): void {
        this.selectedExclusions.splice(index, 1);
        this.emitChanges();
    }

    toggleType(exclusionIndex: number, typeCode: string): void {
        const exclusion = this.selectedExclusions[exclusionIndex];
        const index = exclusion.exclusion_type_codes.indexOf(typeCode);

        if (index > -1) {
            exclusion.exclusion_type_codes.splice(index, 1);
        } else {
            exclusion.exclusion_type_codes.push(typeCode);
        }
        this.emitChanges();
    }

    isTypeSelected(exclusionIndex: number, typeCode: string): boolean {
        return this.selectedExclusions[exclusionIndex].exclusion_type_codes.includes(typeCode);
    }

    private emitChanges(): void {
        // Clean result for output (exclude metadata like available_types)
        const result = this.selectedExclusions.map(e => ({
            exclusion_name: e.exclusion_name,
            exclusion_type_codes: e.exclusion_type_codes
        })).filter(e => e.exclusion_type_codes.length > 0); // Only emit entries with selected types? 
        // Or user might want to report just "Front Bumper" without specific type?
        // But backend usually expects type codes if validation enforces it.
        // For now emitting all added parts, even if no type selected yet (user task to select).

        this.exclusionsChanged.emit(result);
    }
}
