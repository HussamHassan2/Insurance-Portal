import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { OdooLiveChatService, ChatState } from '../../../core/services/odoo-livechat.service';

@Component({
    selector: 'app-live-chat',
    templateUrl: './live-chat.component.html',
    styles: []
})
export class LiveChatComponent implements OnInit {

    chatState$: Observable<ChatState>;

    constructor(private liveChatService: OdooLiveChatService) {
        this.chatState$ = this.liveChatService.getChatState();
    }

    ngOnInit(): void {
        // Initialization handled by AppComponent
    }

    openChat(): void {
        this.liveChatService.openChat();
    }

    closeChat(): void {
        this.liveChatService.closeChat();
    }

    toggleChat(): void {
        this.liveChatService.toggleChat();
    }
}
