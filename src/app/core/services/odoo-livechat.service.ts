import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OdooLiveChatConfig {
    serverUrl: string;
    channelId: string | number;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    customData?: Record<string, any>;
}

export interface ChatState {
    isLoaded: boolean;
    isOpen: boolean;
    isAvailable: boolean;
    unreadCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class OdooLiveChatService {
    private renderer: Renderer2;
    private loaderScript: HTMLScriptElement | null = null;
    private externalLibScript: HTMLScriptElement | null = null;
    private assetsScript: HTMLScriptElement | null = null;
    private queuedModules: Array<any[]> = [];

    private chatState$ = new BehaviorSubject<ChatState>({
        isLoaded: false,
        isOpen: false,
        isAvailable: false,
        unreadCount: 0
    });

    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    /**
     * Get chat state as observable
     */
    getChatState(): Observable<ChatState> {
        return this.chatState$.asObservable();
    }

    /**
     * Get chat state as observable
     */
    async initialize(config: OdooLiveChatConfig): Promise<void> {
        const currentState = this.chatState$.value;

        if (currentState.isLoaded) {
            console.warn('Odoo Live Chat is already initialized');
            return;
        }

        try {
            console.log('Using Odoo Config:', config);
            this.setConfiguration(config);

            // Cleanup stale instances
            this.cleanupStaleScripts();

            // Prepare URL
            let effectiveUrl = config.serverUrl;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                effectiveUrl = ''; // Use proxy if on localhost
            } else if (effectiveUrl.endsWith('/')) {
                effectiveUrl = effectiveUrl.slice(0, -1);
            }

            // Use the single external endpoint which handles everything
            // This avoids the complex module dependency issues of loader/assets
            const externalUrl = `${effectiveUrl}/im_livechat/external/${config.channelId}`;

            await this.loadScript(externalUrl);

            // Wait for ready
            await this.waitForChatReady();

            this.chatState$.next({
                ...currentState,
                isLoaded: true,
                isAvailable: this.checkAvailability()
            });

            this.setupEventListeners();
            console.log('✅ Odoo Live Chat initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Odoo Live Chat:', error);
            throw error;
        }
    }

    private cleanupStaleScripts() {
        if ((window as any).odoo) delete (window as any).odoo;
        const oldScripts = this.document.querySelectorAll('script[src*="im_livechat"]');
        if (oldScripts.length > 0) {
            oldScripts.forEach(script => this.renderer.removeChild(this.document.body, script));
        }
    }

    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = this.renderer.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            this.renderer.appendChild(this.document.body, script);
        });
    }

    private getChatHost(url: string): string {
        if (url.startsWith('http')) {
            try {
                return new URL(url).hostname;
            } catch { return ''; }
        }
        return window.location.hostname;
    }

    /**
     * Set configuration options
     */
    private setConfiguration(config: OdooLiveChatConfig): void {
        (window as any).odoo_livechat_options = {
            default_username: config.userName || 'Visitor',
            default_email: config.userEmail || '',
            default_phone: config.userPhone || '',
            ...config.customData
        };
    }


    /**
     * Wait for chat widget to be ready
     */
    private waitForChatReady(timeout: number = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkReady = setInterval(() => {
                if ((window as any).odoo?.im_livechat) {
                    clearInterval(checkReady);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkReady);
                    reject(new Error('Chat widget initialization timeout'));
                }
            }, 100);
        });
    }

    /**
     * Setup event listeners for chat events
     */
    private setupEventListeners(): void {
        // Listen for chat open/close events
        const widget = this.getChatWidget();

        if (widget) {
            // Monitor chat state changes
            const observer = new MutationObserver(() => {
                this.updateChatState();
            });

            const chatButton = this.document.querySelector('.o_livechat_button');
            if (chatButton) {
                observer.observe(chatButton, {
                    attributes: true,
                    childList: true,
                    subtree: true
                });
            }

            // Also observe chat window if it exists or appears
            const bodyObserver = new MutationObserver(() => {
                const chatWindow = this.document.querySelector('.o_livechat_chatwindow');
                if (chatWindow) {
                    observer.observe(chatWindow, { attributes: true, classList: true } as any);
                }
                this.updateChatState();
            });
            bodyObserver.observe(this.document.body, { childList: true });
        }
    }

    /**
     * Update chat state
     */
    private updateChatState(): void {
        const currentState = this.chatState$.value;

        this.chatState$.next({
            ...currentState,
            isOpen: this.isChatOpen(),
            // Check availability more robustly
            isAvailable: this.checkAvailability(),
            unreadCount: this.getUnreadCount()
        });
    }

    /**
     * Check if chat is available
     */
    private checkAvailability(): boolean {
        // Sometimes availability is in livechatData in older versions
        const available = !!((window as any).odoo?.im_livechat?.available || (window as any).livechatData?.isAvailable);
        console.log('Odoo Availability Check:', available, (window as any).odoo, (window as any).livechatData);
        return available;
    }

    /**
     * Check if chat window is open
     */
    private isChatOpen(): boolean {
        const chatWindow = this.document.querySelector('.o_livechat_chatwindow');
        return chatWindow !== null && !chatWindow.classList.contains('o_closed');
    }

    /**
     * Get unread message count
     */
    private getUnreadCount(): number {
        const badge = this.document.querySelector('.o_livechat_badge');
        return badge ? parseInt(badge.textContent || '0', 10) : 0;
    }

    /**
     * Get chat widget instance
     */
    private getChatWidget(): any {
        return (window as any).odoo?.im_livechat;
    }

    /**
     * Open chat window
     */
    openChat(): void {
        const widget = this.getChatWidget();
        if (widget && widget.open) {
            widget.open();
        } else {
            // Fallback for hybrid: click hidden button
            const btn = this.document.querySelector('.o_livechat_button') as HTMLElement;
            if (btn) btn.click();
        }
        this.updateChatState();
    }

    /**
     * Close chat window
     */
    closeChat(): void {
        const widget = this.getChatWidget();
        if (widget && widget.close) {
            widget.close();
            this.updateChatState();
        }
    }

    /**
     * Toggle chat window
     */
    toggleChat(): void {
        if (this.isChatOpen()) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Send message programmatically
     */
    sendMessage(message: string): void {
        const widget = this.getChatWidget();
        if (widget && widget.sendMessage) {
            widget.sendMessage(message);
        }
    }

    /**
     * Hide chat button
     */
    hideChatButton(): void {
        const button = this.document.querySelector('.o_livechat_button') as HTMLElement;
        if (button) {
            button.style.display = 'none';
            // Force it with style attribute to override Odoo's potential inline styles
            button.setAttribute('style', 'display: none !important');
        }
    }

    /**
     * Show chat button
     */
    showChatButton(): void {
        const button = this.document.querySelector('.o_livechat_button') as HTMLElement;
        if (button) {
            button.style.display = 'block';
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy(): void {
        // Remove scripts
        if (this.loaderScript) {
            this.renderer.removeChild(this.document.body, this.loaderScript);
            this.loaderScript = null;
        }

        if (this.externalLibScript) {
            this.renderer.removeChild(this.document.body, this.externalLibScript);
            this.externalLibScript = null;
        }

        if (this.assetsScript) {
            this.renderer.removeChild(this.document.body, this.assetsScript);
            this.assetsScript = null;
        }

        // Remove chat elements
        const elements = this.document.querySelectorAll(
            '.o_livechat_button, .o_livechat_chatwindow, .o-livechat-root'
        );
        elements.forEach(el => {
            this.renderer.removeChild(this.document.body, el);
        });

        // Cleanup window objects
        delete (window as any).odoo;
        delete (window as any).odoo_livechat_options;

        // Reset state
        this.chatState$.next({
            isLoaded: false,
            isOpen: false,
            isAvailable: false,
            unreadCount: 0
        });

        console.log('🧹 Odoo Live Chat destroyed');
    }
}
