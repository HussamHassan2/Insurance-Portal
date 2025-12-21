import { Component } from '@angular/core';

@Component({
    selector: 'app-guide',
    templateUrl: './guide.component.html'
})
export class GuideComponent {
    guides = [
        {
            title: 'SUPPORT.GUIDE.CARDS.STARTED.TITLE',
            description: 'SUPPORT.GUIDE.CARDS.STARTED.DESC',
            icon: 'rocket',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'SUPPORT.GUIDE.CARDS.POLICY.TITLE',
            description: 'SUPPORT.GUIDE.CARDS.POLICY.DESC',
            icon: 'file-text',
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'SUPPORT.GUIDE.CARDS.CLAIMS.TITLE',
            description: 'SUPPORT.GUIDE.CARDS.CLAIMS.DESC',
            icon: 'alert-circle',
            color: 'bg-red-100 text-red-600'
        },
        {
            title: 'SUPPORT.GUIDE.CARDS.PAYMENTS.TITLE',
            description: 'SUPPORT.GUIDE.CARDS.PAYMENTS.DESC',
            icon: 'shield-check',
            color: 'bg-purple-100 text-purple-600'
        }
    ];
}
