import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-textarea-input',
    template: `
    <div class="mb-4">
      <label *ngIf="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      <textarea
        [placeholder]="placeholder"
        [disabled]="disabled"
        [rows]="rows"
        [(ngModel)]="value"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
        [ngClass]="getTextareaClasses()">
      </textarea>
      <p *ngIf="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  `,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => TextareaInputComponent),
        multi: true
    }]
})
export class TextareaInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() rows = 4;
    @Input() required = false;
    @Input() disabled = false;
    @Input() error = '';

    value = '';
    onChange: any = () => { };
    onTouched: any = () => { };

    getTextareaClasses(): string {
        const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-vertical';
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
