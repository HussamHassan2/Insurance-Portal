import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MessageCircle, Paperclip, X, Send, Loader2 } from 'lucide-angular';
import { ChatBoxComponent } from './chat-box.component';

@NgModule({
    declarations: [
        ChatBoxComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule.pick({ MessageCircle, Paperclip, X, Send, Loader2 })
    ],
    exports: [
        ChatBoxComponent
    ]
})
export class ChatBoxModule { }
