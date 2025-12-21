import { Component } from '@angular/core';

@Component({
    selector: 'app-travel-insurance',
    templateUrl: './travel-insurance.component.html',
    styleUrls: ['./travel-insurance.component.css']
})
export class TravelInsuranceComponent {
    features = [
        'PRODUCTS.TRAVEL.FEATURES.0',
        'PRODUCTS.TRAVEL.FEATURES.1',
        'PRODUCTS.TRAVEL.FEATURES.2',
        'PRODUCTS.TRAVEL.FEATURES.3',
        'PRODUCTS.TRAVEL.FEATURES.4',
        'PRODUCTS.TRAVEL.FEATURES.5'
    ];
}
