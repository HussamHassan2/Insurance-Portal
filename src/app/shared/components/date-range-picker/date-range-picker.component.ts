import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface DateRange {
    from: Date | null;
    to: Date | null;
}

@Component({
    selector: 'app-date-range-picker',
    templateUrl: './date-range-picker.component.html',
    styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit {
    @Input() isOpen: boolean = false;
    @Input() mode: 'single' | 'range' = 'range';
    @Input() selectedRange: DateRange = { from: null, to: null };
    @Input() selectedDate: Date | null = null;
    @Input() minDate: Date | null = null;
    @Input() maxDate: Date | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() apply = new EventEmitter<DateRange>();
    @Output() dateChange = new EventEmitter<Date>();

    currentMonth: Date = new Date();
    calendarDays: (Date | null)[][] = [];
    weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    hoverDate: Date | null = null;
    selectingFrom: boolean = true;

    view: 'calendar' | 'year' = 'calendar';
    years: number[] = [];

    ngOnInit(): void {
        this.generateYears();
        this.generateCalendar();
    }

    generateYears(): void {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 100; i <= currentYear + 20; i++) {
            this.years.push(i);
        }
    }

    generateCalendar(): void {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const startingDayOfWeek = firstDay.getDay();

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Generate calendar grid
        this.calendarDays = [];
        let week: (Date | null)[] = [];

        // Fill in empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            week.push(null);
        }

        // Fill in days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            week.push(new Date(year, month, day));

            if (week.length === 7) {
                this.calendarDays.push(week);
                week = [];
            }
        }

        // Fill in remaining empty cells
        if (week.length > 0) {
            while (week.length < 7) {
                week.push(null);
            }
            this.calendarDays.push(week);
        }
    }

    previousMonth(): void {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() - 1,
            1
        );
        this.generateCalendar();
    }

    nextMonth(): void {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            1
        );
        this.generateCalendar();
    }

    toggleView(): void {
        this.view = this.view === 'calendar' ? 'year' : 'calendar';
    }

    selectYear(year: number): void {
        this.currentMonth = new Date(year, this.currentMonth.getMonth(), 1);
        this.generateCalendar();
        this.view = 'calendar';
    }

    selectDate(date: Date | null): void {
        if (!date || this.isDateDisabled(date)) return;

        if (this.mode === 'single') {
            this.selectedDate = date;
            return;
        }

        if (this.selectingFrom || !this.selectedRange.from) {
            // Selecting start date
            this.selectedRange = { from: date, to: null };
            this.selectingFrom = false;
        } else {
            // Selecting end date
            if (date < this.selectedRange.from!) {
                // If end date is before start, swap them
                this.selectedRange = { from: date, to: this.selectedRange.from };
            } else {
                this.selectedRange.to = date;
            }
            this.selectingFrom = true;
        }
    }

    onMouseEnter(date: Date | null): void {
        if (this.mode === 'single') return;
        if (!date || !this.selectedRange.from || this.selectedRange.to) return;
        this.hoverDate = date;
    }

    onMouseLeave(): void {
        this.hoverDate = null;
    }

    isSelected(date: Date | null): boolean {
        if (!date) return false;

        if (this.mode === 'single') {
            return !!this.selectedDate && this.isSameDay(date, this.selectedDate);
        }

        if (!this.selectedRange.from) return false;

        const dateTime = date.getTime();
        const fromTime = this.selectedRange.from.getTime();

        if (!this.selectedRange.to) {
            return this.isSameDay(date, this.selectedRange.from);
        }

        const toTime = this.selectedRange.to.getTime();
        return dateTime >= fromTime && dateTime <= toTime;
    }

    isRangeStart(date: Date | null): boolean {
        if (this.mode === 'single') return this.isSelected(date);
        if (!date || !this.selectedRange.from) return false;
        return this.isSameDay(date, this.selectedRange.from);
    }

    isRangeEnd(date: Date | null): boolean {
        if (this.mode === 'single') return this.isSelected(date);
        if (!date || !this.selectedRange.to) return false;
        return this.isSameDay(date, this.selectedRange.to);
    }

    isInHoverRange(date: Date | null): boolean {
        if (this.mode === 'single') return false;
        if (!date || !this.selectedRange.from || this.selectedRange.to || !this.hoverDate) {
            return false;
        }

        const dateTime = date.getTime();
        const fromTime = this.selectedRange.from.getTime();
        const hoverTime = this.hoverDate.getTime();

        const minTime = Math.min(fromTime, hoverTime);
        const maxTime = Math.max(fromTime, hoverTime);

        return dateTime >= minTime && dateTime <= maxTime;
    }

    isToday(date: Date | null): boolean {
        if (!date) return false;
        const today = new Date();
        return this.isSameDay(date, today);
    }

    isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    getMonthYearLabel(): string {
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    }

    isDateDisabled(date: Date | null): boolean {
        if (!date) return true;

        if (this.minDate && date < new Date(this.minDate.setHours(0, 0, 0, 0))) return true;
        if (this.maxDate && date > new Date(this.maxDate.setHours(23, 59, 59, 999))) return true;

        return false;
    }

    getDayClasses(date: Date | null): string {
        if (!date) return 'empty';
        if (this.isDateDisabled(date)) return 'disabled';

        const classes: string[] = [];

        if (this.isToday(date)) classes.push('today');
        if (this.isRangeStart(date)) classes.push('range-start');
        if (this.isRangeEnd(date)) classes.push('range-end');
        if (this.isSelected(date) && !this.isRangeStart(date) && !this.isRangeEnd(date)) {
            classes.push('in-range');
        }
        if (this.isInHoverRange(date)) classes.push('hover-range');

        return classes.join(' ');
    }

    onApply(): void {
        if (this.mode === 'single') {
            if (this.selectedDate) {
                this.dateChange.emit(this.selectedDate);
                this.onClose();
            }
        } else {
            if (this.selectedRange.from && this.selectedRange.to) {
                this.apply.emit(this.selectedRange);
                this.onClose();
            }
        }
    }

    onClear(): void {
        if (this.mode === 'single') {
            this.selectedDate = null;
        } else {
            this.selectedRange = { from: null, to: null };
            this.selectingFrom = true;
        }
        this.hoverDate = null;
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
