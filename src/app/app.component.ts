
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AppTranslateService } from './core/services/app-translate.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `<app-toast></app-toast><router-outlet></router-outlet><app-odoo-livechat></app-odoo-livechat>`,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'insurance-portal';

  constructor(
    private appTranslate: AppTranslateService,
    private titleService: Title,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.appTranslate.init();
    this.setDynamicTitle();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
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
