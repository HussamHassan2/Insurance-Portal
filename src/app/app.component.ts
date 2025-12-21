import { Component, OnInit } from '@angular/core';
import { AppTranslateService } from './core/services/app-translate.service';

@Component({
  selector: 'app-root',
  template: `<app-toast></app-toast><router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'insurance-portal';

  constructor(private appTranslate: AppTranslateService) { }

  ngOnInit() {
    this.appTranslate.init();
  }
}
