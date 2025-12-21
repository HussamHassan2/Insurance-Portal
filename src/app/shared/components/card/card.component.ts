import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-card',
    template: `
    <div [ngClass]="getCardClasses()">
      <div *ngIf="title" class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      </div>
      <div [ngClass]="noPadding ? '' : 'p-6'">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    styles: []
})
export class CardComponent {
    @Input() title?: string;
    @Input() noPadding = false;
    @Input() hover = false;

    getCardClasses(): string {
        const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-200';
        const hoverClass = this.hover ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : '';
        return `${baseClasses} ${hoverClass}`;
    }
}
