import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AppTranslateService } from './core/services/app-translate.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `<app-toast></app-toast><router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'insurance-portal';

  constructor(
    private appTranslate: AppTranslateService,
    private titleService: Title,
    private translateService: TranslateService
  ) { }

  ngOnInit() {
    this.appTranslate.init();
    this.setDynamicTitle();
  }

  private setDynamicTitle() {
    const clientId = environment.clientId;
    if (clientId === 'wataniya') {
      this.titleService.setTitle('Al Wataniya Insurance');
    } else {
      this.titleService.setTitle('Orient Insurance Portal');
    }
  }
}
