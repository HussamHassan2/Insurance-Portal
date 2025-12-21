import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css']
})
export class ModalComponent {
    @Input() isOpen = false;
    @Input() title = '';
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
    @Output() close = new EventEmitter<void>();

    getSizeClass(): string {
        const sizes = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            '2xl': 'max-w-6xl'
        };
        return sizes[this.size];
    }

    onClose(): void {
        this.close.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.onClose();
        }
    }
}
