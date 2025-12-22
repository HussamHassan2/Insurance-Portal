import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewChild, OnInit } from '@angular/core';

export interface SelectOption {
    code: string;
    name: string;
    icon?: string;
    image?: string;
    description?: string;
}

@Component({
    selector: 'app-selection-modal',
    templateUrl: './selection-modal.component.html',
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class SelectionModalComponent implements OnInit, OnChanges {
    // Configuration inputs
    @Input() label: string = '';
    @Input() placeholder: string = 'Choose an option...';
    @Input() title: string = 'Select Option';
    @Input() subtitle: string = 'Choose from available options';
    @Input() options: any[] = [];
    @Input() value: string = '';
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    // Layout configuration
    @Input() layout: 'grid' | 'list' | 'auto' = 'auto';
    @Input() gridCols: number = 4;

    // Data mapping keys
    @Input() displayKey: string = 'name';
    @Input() valueKey: string = 'code';
    @Input() iconKey: string = 'icon';
    @Input() imageKey: string = 'image';
    @Input() descriptionKey: string = 'description';

    // Feature flags
    @Input() enableSearch: boolean = true;
    @Input() showIcons: boolean = true;

    // Outputs
    @Output() valueChange = new EventEmitter<string>();
    @Output() change = new EventEmitter<void>();
    @Output() search = new EventEmitter<string>();

    @ViewChild('searchInput') searchInput!: ElementRef;

    // Internal state
    isOpen = false;
    searchQuery = '';
    normalizedOptions: SelectOption[] = [];
    selectedOption: SelectOption | null = null;
    effectiveLayout: 'grid' | 'list' = 'grid';

    constructor() { }

    ngOnInit(): void {
        this.normalizeOptions();
        this.updateSelectedOption();
        this.determineLayout();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options']) {
            this.normalizeOptions();
            this.determineLayout();
        }
        if (changes['value']) {
            this.updateSelectedOption();
        }
    }

    // Normalize options to standard format
    private normalizeOptions(): void {
        console.log(`SelectionModal [${this.label}]: Normalizing options with imageKey:`, this.imageKey); // DEBUG
        this.normalizedOptions = this.options.map(opt => {
            // If it's a string
            if (typeof opt === 'string') {
                return {
                    code: opt,
                    name: opt,
                    icon: '',
                    image: '',
                    description: ''
                };
            }
            // If it's already an object
            const normalized = {
                code: opt[this.valueKey] || opt.code || opt.value || '',
                name: opt[this.displayKey] || opt.name || opt.label || '',
                icon: opt[this.iconKey] || opt.icon || '',
                image: opt[this.imageKey] || opt.image || '',
                description: opt[this.descriptionKey] || opt.description || ''
            };
            return normalized;
        });
        console.log(`SelectionModal [${this.label}]: Normalized Options Sample:`, this.normalizedOptions.slice(0, 2)); // DEBUG
    }

    // Determine layout based on option count
    private determineLayout(): void {
        if (this.layout === 'auto') {
            this.effectiveLayout = this.normalizedOptions.length >= 6 ? 'grid' : 'list';
        } else {
            this.effectiveLayout = this.layout;
        }
    }

    private updateSelectedOption(): void {
        if (this.value) {
            this.selectedOption = this.normalizedOptions.find(
                opt => opt.code === this.value
            ) || null;
        } else {
            this.selectedOption = null;
        }
    }

    get displayValue(): string {
        if (!this.value) return '';
        const selected = this.normalizedOptions.find(opt => opt.code === this.value);
        return selected ? selected.name : '';
    }

    get filteredOptions(): SelectOption[] {
        // If enableSearch is true but no 'search' output is bound (client-side), filter here.
        // But if 'search' output IS used (server-side), we might still show normalizedOptions assuming parent updates them?
        // Let's assume parent updates 'options' input on search.

        // However, existing logic filters locally. 
        // We should support both: emit event AND filter locally? 
        // Or if event emitted, let parent handle data.
        // For now, let's keep local filtering for display if parent doesn't update options immediately, 
        // but typically with server search, parent replaces options.

        if (!this.searchQuery) {
            return this.normalizedOptions;
        }
        const term = this.searchQuery.toLowerCase();
        return this.normalizedOptions.filter(opt =>
            opt.name.toLowerCase().includes(term) ||
            (opt.description?.toLowerCase().includes(term) || false)
        );
    }

    openModal(): void {
        if (this.disabled) return;
        this.isOpen = true;
        this.searchQuery = '';

        // Focus search input after a short delay to allow rendering
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.nativeElement.focus();
            }
        }, 100);
    }

    closeModal(): void {
        this.isOpen = false;
    }

    selectOption(option: SelectOption): void {
        this.value = option.code;
        this.selectedOption = option;
        this.valueChange.emit(this.value);
        this.change.emit();
        this.closeModal();
    }

    onSearch(query: string): void {
        this.searchQuery = query;
        this.search.emit(query);
    }

    isSelected(option: SelectOption): boolean {
        return this.selectedOption?.code === option.code;
    }
}
