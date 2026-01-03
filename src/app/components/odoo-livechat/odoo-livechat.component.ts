import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';

declare var window: any;

@Component({
  selector: 'app-odoo-livechat',
  templateUrl: './odoo-livechat.component.html',
  styleUrls: ['./odoo-livechat.component.css']
})
export class OdooLivechatComponent implements OnInit, OnDestroy {

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    // Wait for Odoo scripts to fully load
    setTimeout(() => {
      this.initializeOdooWidget();
    }, 3000);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  initializeOdooWidget() {
    console.log('🔧 Attempting to initialize Odoo widget from loaded scripts...');

    // Check if Odoo is loaded
    if (!window.odoo) {
      console.error('❌ window.odoo not found');
      return;
    }

    console.log('✅ window.odoo exists:', window.odoo);
    console.log('📋 Session info:', window.odoo.__session_info__);

    // Try to find and call initialization methods
    if (window.odoo.loader && window.odoo.loader.modules) {
      console.log('📦 Available modules:', Object.keys(window.odoo.loader.modules));

      // Look for im_livechat module
      const livechatModule = window.odoo.loader.modules['@im_livechat/embed/common/livechat_service'];
      if (livechatModule) {
        console.log('✅ Found livechat module:', livechatModule);
      }
    }

    // Check for __DEBUG__ mode services
    if (window.odoo.__DEBUG__ && window.odoo.__DEBUG__.services) {
      console.log('🔍 Available services:', Object.keys(window.odoo.__DEBUG__.services));

      // Try to get livechat service
      const services = window.odoo.__DEBUG__.services;
      for (const key in services) {
        if (key.includes('livechat')) {
          console.log(`Found livechat service: ${key}`, services[key]);
        }
      }
    }

    // Try to manually trigger widget rendering
    if (window.odoo.livechatReady) {
      console.log('⏳ Waiting for livechatReady...');
      window.odoo.livechatReady.then(() => {
        console.log('✅ livechatReady resolved');
        this.tryToRenderWidget();
      }).catch((err: any) => {
        console.error('❌ livechatReady error:', err);
      });
    } else {
      console.log('⚠️ No livechatReady promise found');
      this.tryToRenderWidget();
    }
  }

  tryToRenderWidget() {
    console.log('🎨 Attempting to render widget...');

    // Look for the root element
    const rootElement = document.querySelector('[class*="o-livechat-root"]');
    console.log('Root element:', rootElement);

    if (rootElement) {
      console.log('Root element HTML:', rootElement.innerHTML);
      console.log('Root element style:', window.getComputedStyle(rootElement).cssText);
    }

    // Try to access Odoo's internal app/component system
    if (window.odoo.__DEBUG__) {
      console.log('Odoo __DEBUG__:', window.odoo.__DEBUG__);

      // Try to start the app if it hasn't started
      if (window.odoo.__DEBUG__.didLogInfo === false) {
        console.log('Attempting to trigger Odoo app start...');
      }
    }

    // Last resort: try to find any "start" or "mount" methods
    for (const key in window.odoo) {
      if (typeof window.odoo[key] === 'function' && (key.includes('start') || key.includes('mount') || key.includes('init'))) {
        console.log(`Found potential init method: ${key}`);
      }
    }
  }
}
