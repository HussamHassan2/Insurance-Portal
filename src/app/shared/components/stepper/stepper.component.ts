import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface Step {
    title: string;
    description?: string; // Added description based on image text "Enter your vehicle information"
    // Add other properties as needed
}

@Component({
    selector: 'app-modern-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    animations: [
        trigger('scaleIn', [
            transition(':enter', [
                style({ transform: 'scale(0) rotate(-45deg)', opacity: 0 }),
                animate('400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1) rotate(0)', opacity: 1 }))
            ])
        ])
    ]
})
export class ModernStepperComponent {
    @Input() steps: Step[] = [];
    @Input() currentStep: number = 0;
    @Output() stepClick = new EventEmitter<number>();

    get progressPercentage(): number {
        if (!this.steps || this.steps.length <= 1) return 0;
        return (this.currentStep / (this.steps.length - 1)) * 100;
    }
}
