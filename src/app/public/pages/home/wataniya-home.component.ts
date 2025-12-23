import { Component } from '@angular/core';

@Component({
    selector: 'app-wataniya-home',
    templateUrl: './wataniya-home.component.html',
    styles: []
})
export class WataniyaHomeComponent {
    products = [
        { name: 'Motor Insurance', icon: 'car', path: '/products/motor', description: 'Comprehensive coverage for your vehicle.' },
        { name: 'Medical Insurance', icon: 'heart', path: '/products/medical', description: 'Healthcare plans for you and your family.' },
        { name: 'Travel Insurance', icon: 'plane', path: '/products/travel', description: 'Secure your trips and vacations.' },
        { name: 'Property Insurance', icon: 'home', path: '/products/property', description: 'Protect your home and assets.' },
        { name: 'Marine Insurance', icon: 'anchor', path: '/products/marine', description: 'Cargo and vessel insurance solutions.' },
        { name: 'Engineering Insurance', icon: 'settings', path: '/products/engineering', description: 'Coverage for construction and machinery.' }
    ];

    scrollToProducts() {
        const element = document.getElementById('products-grid');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
}
