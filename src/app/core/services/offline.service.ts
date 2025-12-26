import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
    public isOnline$ = this.isOnlineSubject.asObservable();

    constructor() {
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }

    private updateOnlineStatus(isOnline: boolean) {
        this.isOnlineSubject.next(isOnline);
    }

    get isOnline(): boolean {
        return this.isOnlineSubject.value;
    }
}
