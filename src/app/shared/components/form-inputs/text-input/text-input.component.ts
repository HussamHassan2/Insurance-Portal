import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-text-input',
    template: `
    <div class="mb-4">
      <ng-container *ngIf="type === 'date'; else regularInput">
        <app-date-picker
            [label]="label"
            [placeholder]="placeholder"
            [error]="error"
            [hint]="hint"
            [required]="required"
            [disabled]="disabled"
            [min]="min"
            [max]="max"
            [(ngModel)]="value"
            (ngModelChange)="onChange($event)"
            (blur)="onTouched()">
        </app-date-picker>
      </ng-container>
      
      <ng-template #regularInput>
          <label *ngIf="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ label }}
            <span *ngIf="required" class="text-red-500">*</span>
          </label>
          <input
            [type]="type"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [(ngModel)]="value"
            (ngModelChange)="onChange($event)"
            (blur)="onTouched()"
            [ngClass]="getInputClasses()"
          />
          <p *ngIf="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          <p *ngIf="hint && !error" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ hint }}</p>
      </ng-template>
    </div>
  `,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => TextInputComponent),
        multi: true
    }]
})
export class TextInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() type = 'text';
    @Input() required = false;
    @Input() disabled = false;
    @Input() error = '';
    @Input() hint = '';
    @Input() min: Date | string | null = null;
    @Input() max: Date | string | null = null;

    value = '';
    onChange: any = () => { };
    onTouched: any = () => { };

    getInputClasses(): string {
        const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors';
        const errorClasses = this.error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600';
        const disabledClasses = this.disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : '';

        return `${baseClasses} ${errorClasses} ${disabledClasses}`;
    }

    writeValue(value: any): void {
        this.value = value || '';
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
