import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quote-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quote-wizard.component.html',
  styleUrl: './quote-wizard.component.css'
})
export class QuoteWizardComponent {

}
