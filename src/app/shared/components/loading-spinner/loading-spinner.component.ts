import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    template: `
    <div *ngIf="loading" [ngClass]="getContainerClasses()">
      <div [ngClass]="getSpinnerClasses()"></div>
      <p *ngIf="message" class="mt-4 text-gray-600 dark:text-gray-400">{{ message }}</p>
    </div>
  `,
    styles: [`
    .spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
    @Input() loading = true;
    @Input() message = '';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() fullScreen = false;

    getContainerClasses(): string {
        if (this.fullScreen) {
            return 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50';
        }
        return 'flex flex-col items-center justify-center p-8';
    }

    getSpinnerClasses(): string {
        const sizeClasses = {
            sm: 'w-8 h-8',
            md: 'w-12 h-12',
            lg: 'w-16 h-16'
        };
        return `spinner text-primary ${sizeClasses[this.size]}`;
    }
}
