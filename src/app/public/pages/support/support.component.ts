import { Component } from '@angular/core';

@Component({
    selector: 'app-support',
    templateUrl: './support.component.html'
})
export class SupportComponent {
    supportOptions = [
        {
            icon: 'help-circle',
            title: 'SUPPORT.OPTIONS.FAQ.TITLE',
            description: 'SUPPORT.OPTIONS.FAQ.DESC',
            link: '/support/faq',
            color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
        },
        {
            icon: 'message-circle',
            title: 'SUPPORT.OPTIONS.CONTACT.TITLE',
            description: 'SUPPORT.OPTIONS.CONTACT.DESC',
            link: '/contact',
            color: 'bg-green-50 dark:bg-green-900/30 text-green-600'
        },
        {
            icon: 'book-open',
            title: 'SUPPORT.OPTIONS.GUIDE.TITLE',
            description: 'SUPPORT.OPTIONS.GUIDE.DESC',
            link: '/support/guide',
            color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600'
        }
    ];

    faqs = [
        {
            question: 'How do I file a claim?',
            answer: 'You can file a claim through your customer portal by navigating to the Claims section and clicking "File New Claim". Fill out the required information and upload any supporting documents.',
            open: false
        },
        {
            question: 'How long does claim processing take?',
            answer: 'Most claims are processed within 5-7 business days. Complex claims may take longer. You can track your claim status in real-time through your portal.',
            open: false
        },
        {
            question: 'Can I modify my policy coverage?',
            answer: 'Yes, you can request policy modifications through your portal or by contacting your broker. Changes will be reviewed and confirmed within 24-48 hours.',
            open: false
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept credit cards, debit cards, bank transfers, and direct debit. You can set up automatic payments through your portal for convenience.',
            open: false
        },
        {
            question: 'How do I renew my policy?',
            answer: 'We will send you a renewal notice 30 days before your policy expires. You can renew online through your portal or contact us for assistance.',
            open: false
        }
    ];

    toggleFaq(index: number): void {
        this.faqs[index].open = !this.faqs[index].open;
    }
}
