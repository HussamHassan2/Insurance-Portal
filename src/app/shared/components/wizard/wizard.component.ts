import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface WizardStep {
  title: string;
  component: any;
}

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.css']
})
export class WizardComponent implements OnInit {
  @Input() steps: WizardStep[] = [];
  @Input() title: string = '';
  @Input() initialData: any = {};
  @Output() complete = new EventEmitter<{ data: any; isLastStep: boolean }>();

  currentStep: number = 0;
  formData: any = {};
  loading: boolean = false;

  ngOnInit(): void {
    this.formData = { ...this.initialData };
  }

  handleNext(stepData: any): void {
    this.formData = { ...this.formData, ...stepData };

    const isLastStep = this.currentStep === this.steps.length - 1;
    this.complete.emit({ data: this.formData, isLastStep });

    if (!isLastStep) {
      this.currentStep++;
    }
  }

  handleBack(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCompleted(index: number): boolean {
    return index < this.currentStep;
  }

  isCurrent(index: number): boolean {
    return index === this.currentStep;
  }

  getProgressPercentage(): number {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  get currentStepData() {
    return this.steps[this.currentStep];
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }
}
