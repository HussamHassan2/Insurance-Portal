import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'broker' | 'admin' | 'surveyor';
  token?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  zip?: string;
  image?: string;
  identification_code?: string;
}

export interface LoginResponse {
  error?: {
    data?: { message?: string };
    message?: string;
  };
  result?: {
    data?: {
      token?: string;
      user?: User;
    };
  };
}

import { CustomerService } from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private loadingSubject: BehaviorSubject<boolean>;
  public loading: Observable<boolean>;

  constructor(private api: ApiService, private customerService: CustomerService) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();

    this.loadingSubject = new BehaviorSubject<boolean>(false);
    this.loading = this.loadingSubject.asObservable();
  }

  private imageFetchAttempted = false;

  ensureCustomerImage(): void {
    const user = this.currentUserSubject.value;
    if (!user || user.role !== 'customer' || user.image || this.imageFetchAttempted) {
      return;
    }

    this.imageFetchAttempted = true;
    this.customerService.getCustomerInfo(user.id).subscribe({
      next: (response) => {
        const customerInfo = response.data?.customer_info || response.customer_info || response.data?.result?.data || response.data?.result || response.data || {};
        let image = customerInfo.customer_image || customerInfo.image;

        // Clean Python bytes string representation if present
        if (typeof image === 'string' && image.startsWith("b'") && image.endsWith("'")) {
          image = image.substring(2, image.length - 1);
        }

        if (image && typeof image === 'string' && image !== 'false') {
          this.updateCurrentUser({ image });
        }
      },
      error: (err) => console.error('Failed to fetch customer image', err)
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login - Matches React app's auth.service.js login method
   */
  login(email: string, password: string): Observable<any> {
    this.loadingSubject.next(true);

    return this.api.post<LoginResponse>('/auth', {
      params: {
        login: email,
        password: password
      }
    }).pipe(
      map(response => {
        // Check for Odoo JSON-RPC error (which comes with 200 OK status)
        if (response.error) {
          const errorData = response.error;
          const errorMessage = errorData.data?.message || errorData.message || 'Odoo Server Error';
          throw new Error(errorMessage);
        }


        const token = response.result?.data?.token;
        if (token) {
          localStorage.setItem('authToken', token);

          // Map API response to User object
          const data = response.result?.data as any;
          if (data) {
            const userData: User = {
              id: data.uid,
              email: email, // Email not in response, use input
              name: data.name,
              role: data.role,
              token: data.token,
              // Map other optional fields if present
              phone: data.phone,
              mobile: data.mobile,
              address: data.address,
              city: data.city,
              country: data.country,
              state: data.state,
              zip: data.zip,
              image: data.image,
              identification_code: data.identification_code
            };

            localStorage.setItem('currentUser', JSON.stringify(userData));
            this.currentUserSubject.next(userData);
          }
        } else {
          throw new Error('Authentication failed: No token received');
        }

        this.loadingSubject.next(false);
        return response;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout - Matches React app's auth.service.js logout method
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Request OTP for password reset - Matches React app's requestOtp method
   */
  requestOtp(email: string): Observable<any> {
    return this.api.post('/v1/auth/request_otp', {
      params: {
        email: email
      }
    });
  }

  /**
   * Verify OTP - Matches React app's verifyOtp method
   */
  verifyOtp(email: string, otp: string): Observable<any> {
    return this.api.post('/v1/auth/verify_otp', {
      params: {
        email: email,
        otp: otp
      }
    });
  }

  /**
   * Change Password (Update) - Matches React app's updatePassword method
   */
  updatePassword(userId: number, newPassword: string): Observable<any> {
    return this.api.post('/v1/auth/change_password', {
      params: {
        user_id: userId,
        new_password: newPassword
      }
    });
  }

  /**
   * Change Password (Reset Flow) - Matches React app's changePassword method
   */
  changePassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.api.post('/v1/auth/change_password', {
      params: {
        email: email,
        token: token,
        new_password: newPassword
      }
    });
  }

  /**
   * Change Password with Current Password - For logged-in users
   */
  changePasswordWithCurrent(currentPassword: string, newPassword: string): Observable<any> {
    const email = this.currentUserValue?.email;
    return this.api.post('/v1/auth/change-password', {
      params: {
        email: email,
        old_password: currentPassword,
        new_password: newPassword
      }
    });
  }

  /**
   * Register Portal User - Matches React app's register method
   */
  register(userData: any): Observable<any> {
    // Map UI fields to API keys - exact match with React app
    const params = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      mobile: userData.mobile || userData.phone,
      address: userData.address || '',
      gender: userData.gender || 'male',
      date_of_birth: userData.dateOfBirth || userData.date_of_birth || '',
      national_id: userData.nationalId || userData.national_id || '',
      passport: userData.passport || '',
      passport_id: userData.passportId || userData.passport_id || '',
      is_customer: userData.role === 'customer' || userData.is_customer || true,
      is_broker: userData.role === 'broker' || userData.is_broker || false,
      is_surveyor: userData.is_surveyor || false,
      is_business_source: userData.is_business_source || false
    };

    return this.api.post('/v1/partner/register-portal-user', {
      params: params
    });
  }

  /**
   * Get auth token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Update Current User - Allows partial updates to the current user state
   */
  updateCurrentUser(userUpdates: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userUpdates };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }
}
