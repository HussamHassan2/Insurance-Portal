import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'dynamicTranslate',
    pure: false // Makes pipe update when language changes
})
export class DynamicTranslatePipe implements PipeTransform {
    constructor(private translate: TranslateService) { }

    transform(value: any, prefix?: string): string {
        if (!value) return '';

        // If it's already a translation key format
        if (typeof value === 'string' && value.includes('.')) {
            return this.translate.instant(value);
        }

        // If prefix provided, construct key
        if (prefix) {
            const key = `${prefix}.${value}`;
            const translation = this.translate.instant(key);
            // Return translation if found, otherwise return original value
            return translation !== key ? translation : value;
        }

        return value;
    }
}
