import { Component } from '@angular/core';

@Component({
    selector: 'app-engineering-insurance',
    templateUrl: './engineering-insurance.component.html',
    styleUrls: ['./engineering-insurance.component.css']
})
export class EngineeringInsuranceComponent {
    features = [
        'PRODUCTS.ENGINEERING.FEATURES.0',
        'PRODUCTS.ENGINEERING.FEATURES.1',
        'PRODUCTS.ENGINEERING.FEATURES.2',
        'PRODUCTS.ENGINEERING.FEATURES.3',
        'PRODUCTS.ENGINEERING.FEATURES.4',
        'PRODUCTS.ENGINEERING.FEATURES.5'
    ];
}
