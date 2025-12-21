import { Component } from '@angular/core';

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html'
})
export class FaqComponent {
    faqs = [
        {
            question: 'How do I file a claim?',
            answer: 'You can file a claim by clicking on the "Create Claim" button on your dashboard and following the multi-step process. You will need to provide the chassis number and details about the loss.',
            open: false
        },
        {
            question: 'How can I renew my policy?',
            answer: 'To renew your policy, go to the "Policies" section, find your soon-to-expire policy, and click the "Renew" button. Follow the prompts to complete the payment and renewal.',
            open: false
        },
        {
            question: 'What documents are required for medical insurance?',
            answer: 'Typically, you need a valid National ID or Passport, any previous medical records if applicable, and a completed health questionnaire.',
            open: false
        },
        {
            question: 'Can I add a driver to my motor insurance?',
            answer: 'Yes, you can add additional drivers to your policy. Go to your policy details and select "Add Driver", or contact our support team for assistance.',
            open: false
        },
        {
            question: 'How long does it take to process a claim?',
            answer: 'Claim processing times vary depending on the complexity and type of claim. Generally, straightforward claims are processed within 5-7 business days of receiving all required documentation.',
            open: false
        }
    ];

    toggleFaq(index: number): void {
        this.faqs[index].open = !this.faqs[index].open;
    }
}
