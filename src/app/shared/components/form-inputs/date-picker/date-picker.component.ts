import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-date-picker',
    template: `
    <div class="relative">
        <label *ngIf="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ label }}
            <span *ngIf="required" class="text-red-500">*</span>
        </label>
        
        <div class="relative">
            <input
                type="text"
                [value]="displayValue"
                [placeholder]="placeholder || 'Select date'"
                [disabled]="disabled"
                readonly
                (click)="toggle()"
                [class]="getInputClasses()"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i-lucide name="calendar" class="w-4 h-4"></i-lucide>
            </div>
        </div>

        <p *ngIf="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <p *ngIf="hint && !error" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ hint }}</p>

        <!-- Popup -->
        <app-date-range-picker
            *ngIf="isOpen"
            [isOpen]="true"
            mode="single"
            [selectedDate]="value"
            [minDate]="minDate"
            [maxDate]="maxDate"
            (dateChange)="onDateSelected($event)"
            (close)="close()"
            class="absolute top-full left-0 z-50 mt-1"
        ></app-date-range-picker>
    </div>
  `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        },
        DatePipe
    ]
})
export class DatePickerComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() required = false;
    @Input() disabled = false;
    @Input() error = '';
    @Input() hint = '';
    @Input() min: Date | string | null = null;
    @Input() max: Date | string | null = null;

    get minDate(): Date | null {
        return this.min ? new Date(this.min) : null;
    }

    get maxDate(): Date | null {
        return this.max ? new Date(this.max) : null;
    }

    value: Date | null = null;
    isOpen = false;

    onChange: any = () => { };
    onTouched: any = () => { };

    constructor(private datePipe: DatePipe, private elementRef: ElementRef) { }

    get displayValue(): string {
        return this.value ? this.datePipe.transform(this.value, 'dd/MM/yyyy') || '' : '';
    }

    getInputClasses(): string {
        const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors cursor-pointer bg-white';
        const errorClasses = this.error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600';
        const disabledClasses = this.disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75 pointer-events-none' : '';

        return `${baseClasses} ${errorClasses} ${disabledClasses}`;
    }

    toggle(): void {
        if (!this.disabled) {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.onTouched();
            }
        }
    }

    close(): void {
        this.isOpen = false;
    }

    onDateSelected(date: Date): void {
        this.value = date;
        this.onChange(date); // Emit Date object
        this.close();
    }

    writeValue(value: any): void {
        if (value) {
            this.value = new Date(value);
        } else {
            this.value = null;
        }
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

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }
}
