import { Component } from '@angular/core';

@Component({
    selector: 'app-motor-insurance',
    templateUrl: './motor-insurance.component.html',
    styleUrls: ['./motor-insurance.component.css']
})
export class MotorInsuranceComponent {
    features = [
        'PRODUCTS.MOTOR.FEATURES.0',
        'PRODUCTS.MOTOR.FEATURES.1',
        'PRODUCTS.MOTOR.FEATURES.2',
        'PRODUCTS.MOTOR.FEATURES.3',
        'PRODUCTS.MOTOR.FEATURES.4',
        'PRODUCTS.MOTOR.FEATURES.5'
    ];
}
