import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Toast } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div *ngFor="let toast of toasts" 
           class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-xl border-l-4 transform transition-all duration-300 animate-slideInRight flex items-start gap-3 bg-white dark:bg-gray-800"
           [ngClass]="{
             'border-green-500 text-green-800 dark:text-green-100': toast.type === 'success',
             'border-red-500 text-red-800 dark:text-red-100': toast.type === 'error',
             'border-blue-500 text-blue-800 dark:text-blue-100': toast.type === 'info',
             'border-yellow-500 text-yellow-800 dark:text-yellow-100': toast.type === 'warning'
           }">
        
        <!-- Icon -->
        <span class="flex-shrink-0 mt-0.5">
            <svg *ngIf="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg *ngIf="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <svg *ngIf="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <svg *ngIf="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </span>

        <p class="text-sm font-medium leading-5 flex-1">{{ toast.message }}</p>

        <!-- Close Button -->
        <button (click)="remove(toast.id)" class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
    styles: [`
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slideInRight {
      animation: slideInRight 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    private subscription: Subscription = new Subscription();

    constructor(private notificationService: NotificationService) { }

    ngOnInit() {
        this.subscription = this.notificationService.toastState.subscribe((toast: Toast) => {
            this.toasts.push(toast);
            if (toast.duration && toast.duration > 0) {
                setTimeout(() => this.remove(toast.id), toast.duration);
            }
        });
    }

    remove(id: string) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
