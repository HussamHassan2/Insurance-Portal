import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewChild, OnInit } from '@angular/core';

export interface SelectOption {
    code: string;
    name: string;
    icon?: string;
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
    @Input() descriptionKey: string = 'description';

    // Feature flags
    @Input() enableSearch: boolean = true;
    @Input() showIcons: boolean = true;

    // Outputs
    @Output() valueChange = new EventEmitter<string>();
    @Output() change = new EventEmitter<void>();

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
        this.normalizedOptions = this.options.map(opt => {
            // If it's a string
            if (typeof opt === 'string') {
                return {
                    code: opt,
                    name: opt,
                    icon: '',
                    description: ''
                };
            }
            // If it's already an object
            return {
                code: opt[this.valueKey] || opt.code || opt.value || '',
                name: opt[this.displayKey] || opt.name || opt.label || '',
                icon: opt[this.iconKey] || opt.icon || '',
                description: opt[this.descriptionKey] || opt.description || ''
            };
        });
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
    }

    isSelected(option: SelectOption): boolean {
        return this.selectedOption?.code === option.code;
    }
}
