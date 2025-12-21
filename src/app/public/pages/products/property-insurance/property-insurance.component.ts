import { Component } from '@angular/core';

@Component({
    selector: 'app-property-insurance',
    templateUrl: './property-insurance.component.html',
    styleUrls: ['./property-insurance.component.css']
})
export class PropertyInsuranceComponent {
    features = [
        'PRODUCTS.PROPERTY.FEATURES.0',
        'PRODUCTS.PROPERTY.FEATURES.1',
        'PRODUCTS.PROPERTY.FEATURES.2',
        'PRODUCTS.PROPERTY.FEATURES.3',
        'PRODUCTS.PROPERTY.FEATURES.4',
        'PRODUCTS.PROPERTY.FEATURES.5'
    ];
}
