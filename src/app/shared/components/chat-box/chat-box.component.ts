import { Component, Input, OnInit } from '@angular/core';
import { PortalChatService } from '@core/services/portal-chat.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.css']
})
export class ChatBoxComponent implements OnInit {
    @Input() recordId: number = 0;
    @Input() modelName: string = '';

    message: string = '';
    isSending: boolean = false;
    selectedFile: File | null = null;

    constructor(
        private chatService: PortalChatService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void { }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    removeFile(): void {
        this.selectedFile = null;
    }

    sendMessage(): void {
        if (!this.message && !this.selectedFile) {
            return;
        }

        if (!this.recordId || !this.modelName) {
            this.notificationService.error('Missing record information');
            return;
        }

        this.isSending = true;

        // Convert file to base64 if exists
        if (this.selectedFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                this.submitMessage(base64String, this.selectedFile?.name, this.selectedFile?.type);
            };
            reader.readAsDataURL(this.selectedFile);
        } else {
            this.submitMessage();
        }
    }

    private submitMessage(fileData?: string, fileName?: string, fileType?: string): void {
        const payload = {
            params: {
                is_external_message: true,
                record_id: this.recordId,
                model_name: this.modelName,
                message: this.message,
                attachments: fileData ? [{
                    name: fileName,
                    datas: fileData,
                    type: fileType // API might imply type handling or we send empty if not needed by specific backend logic
                }] : []
            }
        };

        this.chatService.sendMessage(payload).subscribe({
            next: (response: any) => {
                if (response.result && response.result.success === false) {
                    this.notificationService.error(response.result.error || 'Failed to send message');
                    this.isSending = false;
                    return;
                }

                this.notificationService.success('Message sent successfully');
                this.message = '';
                this.selectedFile = null;
                this.isSending = false;
            },
            error: (err: any) => {
                console.error('Error sending message:', err);
                this.notificationService.error('Failed to send message');
                this.isSending = false;
            }
        });
    }
}
