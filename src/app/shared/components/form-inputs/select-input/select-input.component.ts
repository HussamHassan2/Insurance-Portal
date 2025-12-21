import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
    value: any;
    label: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-select-input',
    template: `
    <div class="mb-4">
      <app-selection-modal
        [label]="label"
        [placeholder]="placeholder"
        [options]="options"
        [value]="value"
        [disabled]="disabled"
        [required]="required"
        [title]="'Select ' + label"
        [subtitle]="'Choose from available options'"
        [valueKey]="'value'" 
        [displayKey]="'label'"
        (valueChange)="onValueChange($event)">
      </app-selection-modal>
      <p *ngIf="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  `,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => SelectInputComponent),
        multi: true
    }]
})
export class SelectInputComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() options: SelectOption[] = [];
    @Input() required = false;
    @Input() disabled = false;
    @Input() error = '';

    value: any = '';
    onChange: any = () => { };
    onTouched: any = () => { };

    getSelectClasses(): string {
        return ''; // No longer used but kept for compatibility if needed
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

    onValueChange(newValue: any): void {
        this.value = newValue;
        this.onChange(this.value);
        this.onTouched();
    }
}
