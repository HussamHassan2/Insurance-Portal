import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styles: []
})
export class FooterComponent {
    clientId = environment.clientId;
    currentYear = new Date().getFullYear();
}
