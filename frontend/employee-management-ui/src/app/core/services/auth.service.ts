import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserSession {
  username: string;
  role: 'HR' | 'Employee' | string;
  userId: number;
  employeeId?: number;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$: Observable<UserSession | null> = this.currentUserSubject.asObservable();
  
  private tokenKey = 'emp_mgmt_token';

  constructor(private http: HttpClient) {
    this.autoLogin();
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  public hasRole(role: string): boolean {
    return this.currentUserValue?.role === role;
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth/login`, {
      username,
      password
    }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          const decoded = this.decodeToken(res.token);
          this.currentUserSubject.next(decoded);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  updateCurrentUserProfileImage(imageUrl: string): void {
    const current = this.currentUserValue;
    if (current) {
      current.profileImage = imageUrl;
      this.currentUserSubject.next({ ...current });
    }
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, password });
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private autoLogin(): void {
    const token = this.getToken();
    if (!token) return;

    const decoded = this.decodeToken(token);
    if (decoded) {
      this.currentUserSubject.next(decoded);
    } else {
      this.logout();
    }
  }

  private decodeToken(token: string): UserSession | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Standard JWT base64 decode for URL-safe base64 strings
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(payloadBase64));

      // Parse standard C# claim mappings from the JWT payload
      const username = decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedPayload['unique_name'];
      const role = decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedPayload['role'];
      const userId = Number(decodedPayload['UserId'] || decodedPayload['nameid']);
      const employeeId = Number(decodedPayload['EmployeeId']);
      const profileImage = decodedPayload['ProfileImage'];

      return {
        username: username || '',
        role: role || '',
        userId: userId || 0,
        employeeId: employeeId || undefined,
        profileImage: profileImage || undefined
      };
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  }
}
