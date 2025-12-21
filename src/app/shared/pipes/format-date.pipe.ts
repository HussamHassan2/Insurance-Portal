import { Pipe, PipeTransform } from '@angular/core';

/**
 * Date Formatting Pipe
 * Converts ISO date strings to DD/MM/YYYY format
 * 
 * Usage in template:
 * {{ dateString | formatDate }}
 * {{ '2025-12-20T04:54:21+02:00' | formatDate }} => "20/12/2025"
 */
@Pipe({
    name: 'formatDate',
    standalone: true
})
export class FormatDatePipe implements PipeTransform {
    transform(dateString: string | null | undefined): string {
        if (!dateString) {
            return 'N/A';
        }

        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                return dateString;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    }
}
