import { Component } from '@angular/core';

@Component({
    selector: 'app-marine-insurance',
    templateUrl: './marine-insurance.component.html',
    styleUrls: ['./marine-insurance.component.css']
})
export class MarineInsuranceComponent {
    features = [
        'PRODUCTS.MARINE.FEATURES.0',
        'PRODUCTS.MARINE.FEATURES.1',
        'PRODUCTS.MARINE.FEATURES.2',
        'PRODUCTS.MARINE.FEATURES.3',
        'PRODUCTS.MARINE.FEATURES.4',
        'PRODUCTS.MARINE.FEATURES.5'
    ];
}
