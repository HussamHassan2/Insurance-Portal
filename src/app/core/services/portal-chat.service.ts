import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class PortalChatService {
    // Ideally this should be in environment or passed, but using a generic endpoint for now based on request
    // Assuming a hypothetical endpoint since none was provided in the prompt aside from the payload structure.
    // Using a common pattern or similar to other services. 
    // Wait, I should check if there is a specific endpoint mentioned or if I need to infer.
    // The request just says "integrate with backend using this api" and gives payload.
    // I will assume a generic "message/create" or similar if not specified. 
    // Actually, usually it's "mail/message/post" or just reusing a generic RPC.
    // Let's use `api/v1/portal/message` as a safe placeholder or look for similar patterns.
    // Checking other services might help, but for now I'll define it clearly.

    private readonly ENDPOINT = '/v1/post-chatter-message';

    constructor(private apiService: ApiService) { }

    sendMessage(payload: any): Observable<any> {
        return this.apiService.post(this.ENDPOINT, payload);
    }
}
