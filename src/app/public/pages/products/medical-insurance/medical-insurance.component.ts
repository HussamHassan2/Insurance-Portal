import { Component } from '@angular/core';

@Component({
    selector: 'app-medical-insurance',
    templateUrl: './medical-insurance.component.html',
    styleUrls: ['./medical-insurance.component.css']
})
export class MedicalInsuranceComponent {
    features = [
        'PRODUCTS.MEDICAL.FEATURES.0',
        'PRODUCTS.MEDICAL.FEATURES.1',
        'PRODUCTS.MEDICAL.FEATURES.2',
        'PRODUCTS.MEDICAL.FEATURES.3',
        'PRODUCTS.MEDICAL.FEATURES.4',
        'PRODUCTS.MEDICAL.FEATURES.5'
    ];
}
