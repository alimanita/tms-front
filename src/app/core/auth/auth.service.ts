import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User } from './auth.models';

const ACCESS_TOKEN_KEY = 'tms_access_token';
const REFRESH_TOKEN_KEY = 'tms_refresh_token';
const USER_KEY = 'tms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly userSignal = signal<User | null>(this.loadStoredUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getAccessToken() && !!this.userSignal());

  login(request: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/v1/auth/login`, request).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => response.user),
      catchError((error) => throwError(() => error))
    );
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.getAccessToken()) {
      this.clearSession();
      return of(null);
    }

    return this.http.get<User>(`${this.apiUrl}/api/v1/auth/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.userSignal.set(response.user);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
