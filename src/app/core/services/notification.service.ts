import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private toastSubject = new Subject<Toast>();
    toastState = this.toastSubject.asObservable();

    constructor() { }

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000) {
        this.toastSubject.next({
            id: Math.random().toString(36).substring(7),
            type,
            message,
            duration
        });
    }

    success(message: string, duration?: number) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number) {
        this.show(message, 'error', duration);
    }

    info(message: string, duration?: number) {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration?: number) {
        this.show(message, 'warning', duration);
    }
}
