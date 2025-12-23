import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styles: []
})
export class HomeComponent {
    clientId = environment.clientId;
    products = [
        { name: 'Motor Insurance', path: '/products/motor' },
        { name: 'Medical Insurance', path: '/products/medical' },
        { name: 'Travel Insurance', path: '/products/travel' },
        { name: 'Property Insurance', path: '/products/property' },
        { name: 'Marine Insurance', path: '/products/marine' },
        { name: 'Engineering Insurance', path: '/products/engineering' }
    ];

    getProductKey(name: string): string {
        const map: { [key: string]: string } = {
            'Motor Insurance': 'MOTOR',
            'Medical Insurance': 'MEDICAL',
            'Travel Insurance': 'TRAVEL',
            'Property Insurance': 'PROPERTY',
            'Marine Insurance': 'MARINE',
            'Engineering Insurance': 'ENGINEERING'
        };
        return map[name] || 'MOTOR';
    }

    scrollToProducts() {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
