import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { TableColumn, ColumnPreferences } from '../../models/table-column.interface';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-column-toggle',
    templateUrl: './column-toggle.component.html',
    styleUrls: ['./column-toggle.component.scss']
})
export class ColumnToggleComponent implements OnInit {
    @Input() columns: TableColumn[] = [];
    @Input() pageId!: string;
    @Input() defaultHiddenColumns: string[] = [];

    @Output() visibleColumnsChange = new EventEmitter<TableColumn[]>();

    isDropdownOpen = false;
    searchTerm = '';
    localColumns: TableColumn[] = [];

    constructor(
        private elementRef: ElementRef,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        if (!this.pageId) {
            console.error('ColumnToggleComponent: pageId is required');
            return;
        }

        this.initializeColumns();
        this.loadPreferences();
        this.emitVisibleColumns();
    }

    private initializeColumns(): void {
        // Deep copy columns and apply default hidden state
        // We map to new objects to avoid mutating the original input array directly if it's reused
        this.localColumns = this.columns.map(col => ({
            ...col,
            visible: col.mandatory ? true : !this.defaultHiddenColumns.includes(col.key)
        }));
    }

    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem(`column-prefs-${this.pageId}`);
            if (stored) {
                const prefs: ColumnPreferences = JSON.parse(stored);
                this.applyPreferences(prefs);
            }
        } catch (error) {
            console.warn('Failed to load column preferences, using defaults:', error);
        }
    }

    private applyPreferences(prefs: ColumnPreferences): void {
        this.localColumns.forEach(col => {
            if (col.mandatory) {
                col.visible = true; // Mandatory columns always visible
            } else {
                col.visible = !prefs.hiddenColumns.includes(col.key);
            }
        });
    }

    private savePreferences(): void {
        try {
            const hiddenColumns = this.localColumns
                .filter(col => !col.visible && !col.mandatory)
                .map(col => col.key);

            const prefs: ColumnPreferences = { hiddenColumns };
            localStorage.setItem(`column-prefs-${this.pageId}`, JSON.stringify(prefs));
        } catch (error) {
            console.error('Failed to save column preferences:', error);
        }
    }

    toggleColumn(column: TableColumn): void {
        if (column.mandatory) {
            return;
        }

        // Ensure at least one column remains visible
        const visibleCount = this.localColumns.filter(col => col.visible).length;
        if (visibleCount === 1 && column.visible) {
            // Alert is a bit intrusive, maybe just prevent it nicely or define a toast service later.
            // For now, standard alert as per common practice or just ignore.
            // User request included alert usage.
            this.notificationService.warning('At least one column must remain visible.');
            return;
        }

        column.visible = !column.visible;
        this.savePreferences();
        this.emitVisibleColumns();
    }

    selectAll(): void {
        this.localColumns.forEach(col => {
            col.visible = true;
        });
        this.savePreferences();
        this.emitVisibleColumns();
    }

    deselectAll(): void {
        let firstNonMandatory = true;
        this.localColumns.forEach(col => {
            if (col.mandatory) {
                col.visible = true;
            } else if (firstNonMandatory && !this.hasMandatoryColumns) {
                // If there are NO mandatory columns, we must keep at least one non-mandatory visible
                col.visible = true;
                firstNonMandatory = false;
            } else {
                col.visible = false;
            }
        });
        this.savePreferences();
        this.emitVisibleColumns();
    }

    get hasMandatoryColumns(): boolean {
        return this.localColumns.some(c => c.mandatory);
    }

    resetToDefault(): void {
        this.initializeColumns();
        this.savePreferences();
        this.emitVisibleColumns();
    }

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (!this.isDropdownOpen) {
            this.searchTerm = '';
        }
    }

    private emitVisibleColumns(): void {
        const visible = this.localColumns.filter(col => col.visible);
        this.visibleColumnsChange.emit(visible);
    }

    get visibleCount(): number {
        return this.localColumns.filter(col => col.visible).length;
    }

    get totalCount(): number {
        return this.localColumns.length;
    }

    get filteredColumns(): TableColumn[] {
        if (!this.searchTerm) {
            return this.localColumns;
        }
        const term = this.searchTerm.toLowerCase();
        return this.localColumns.filter(col =>
            col.label.toLowerCase().includes(term) ||
            col.key.toLowerCase().includes(term)
        );
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isDropdownOpen = false;
            this.searchTerm = '';
        }
    }

    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.isDropdownOpen) {
            this.isDropdownOpen = false;
            this.searchTerm = '';
        }
    }
}
