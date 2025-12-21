import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class BrokerService {

  constructor(private api: ApiService) { }

  /**
   * Get Commissions
   */
  getCommissions(agentId: number, paymentStatus: 'paid' | 'outstanding' = 'paid', limit?: number, offset?: number): Observable<any> {
    const params: any = {
      agent_id: agentId,
      payment_status: paymentStatus
    };

    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    return this.api.get('/v1/broker/commissions', { params }).pipe(
      map((response: any) => {
        if (response.error && response.error.message && response.error.message.includes('No commission lines found')) {
          return { result: { data: [] } };
        }
        return response;
      })
    );
  }

  /**
   * Get Premiums
   */
  getPremiums(agentId: number, paymentStatus: 'paid' | 'outstanding' = 'paid', limit?: number, offset?: number): Observable<any> {
    const params: any = {
      agent_id: agentId,
      payment_status: paymentStatus
    };

    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    return this.api.get('/v1/broker/premiums', { params }).pipe(
      map((response: any) => {
        if (response.error && response.error.message && response.error.message.includes('No premiums found')) {
          return { result: { data: [] } };
        }
        return response;
      })
    );
  }
}
