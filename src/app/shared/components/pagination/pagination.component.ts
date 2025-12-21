import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
    @Input() currentPage: number = 1;
    @Input() pageSize: number = 25;
    @Input() totalRecords: number = 0;

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    pageSizeOptions = [10, 25, 50, 100];

    get totalPages(): number {
        return Math.ceil(this.totalRecords / this.pageSize);
    }

    get startRecord(): number {
        return this.totalRecords === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    }

    get endRecord(): number {
        const end = this.currentPage * this.pageSize;
        return end > this.totalRecords ? this.totalRecords : end;
    }

    get canGoPrevious(): boolean {
        return this.currentPage > 1;
    }

    get canGoNext(): boolean {
        return this.currentPage < this.totalPages;
    }

    onPageSizeChange(newSize: number): void {
        this.pageSizeChange.emit(newSize);
    }

    goToFirstPage(): void {
        if (this.currentPage !== 1) {
            this.pageChange.emit(1);
        }
    }

    goToPreviousPage(): void {
        if (this.canGoPrevious) {
            this.pageChange.emit(this.currentPage - 1);
        }
    }

    goToNextPage(): void {
        if (this.canGoNext) {
            this.pageChange.emit(this.currentPage + 1);
        }
    }

    goToLastPage(): void {
        if (this.currentPage !== this.totalPages) {
            this.pageChange.emit(this.totalPages);
        }
    }
}
