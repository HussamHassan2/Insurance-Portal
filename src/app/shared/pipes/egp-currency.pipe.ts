import { Pipe, PipeTransform } from '@angular/core';

/**
 * Currency Pipe for Egyptian Pounds (EGP)
 * Formats numbers with comma separators and EGP suffix
 * 
 * Usage in template:
 * {{ value | currency }}
 * {{ 1234567.89 | currency }} => "1,234,567.89 EGP"
 */
@Pipe({
    name: 'egpCurrency',
    standalone: true
})
export class EgpCurrencyPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value === null || value === undefined || isNaN(value)) {
            return '0 EGP';
        }

        const formatted = value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return `${formatted} EGP`;
    }
}
