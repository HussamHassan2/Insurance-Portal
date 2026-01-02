import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-odoo-livechat',
  templateUrl: './odoo-livechat.component.html',
  styleUrls: ['./odoo-livechat.component.css']
})
export class OdooLivechatComponent implements OnInit {
  chatUrl!: SafeResourceUrl;
  isVisible: boolean = true;
  isMinimized: boolean = true;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Try these URLs in order until you find the chat widget (not the full page)

    // Option 1: Try this first (livechat support endpoint)
    const url = 'http://165.227.174.138/im_livechat/support/1';

    // Option 2: If #1 shows full page, uncomment this
    // const url = 'http://165.227.174.138/im_livechat/loader/1';

    // Option 3: If #2 shows full page, uncomment this
    // const url = 'http://165.227.174.138/im_livechat/external/1';

    // Option 4: If #3 shows full page, uncomment this
    // const url = 'http://165.227.174.138/website/livechat';

    // Option 5: Original URL (if nothing else works)
    // const url = 'http://165.227.174.138/livechat/channel/orient-1';

    this.chatUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log('✅ Odoo Live Chat iframe initialized');
    console.log('🔗 Loading chat widget from:', url);
  }

  toggleChat() {
    console.log('🔄 Toggle chat clicked! Current state:', this.isMinimized);
    this.isMinimized = !this.isMinimized;
    console.log('🔄 New state:', this.isMinimized);
  }

  closeChat() {
    this.isVisible = false;
  }
}
