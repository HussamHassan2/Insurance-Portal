import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-button',
    template: `
    <button 
      [ngClass]="getButtonClasses()"
      [disabled]="disabled"
      [type]="type">
      <ng-content></ng-content>
    </button>
  `,
    styles: []
})
export class ButtonComponent {
    @Input() variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' = 'primary';
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() disabled = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() fullWidth = false;

    getButtonClasses(): string {
        const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variantClasses = {
            primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-md hover:shadow-lg',
            secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
            ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg'
        };

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg'
        };

        const widthClass = this.fullWidth ? 'w-full' : '';

        return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${widthClass}`;
    }
}
