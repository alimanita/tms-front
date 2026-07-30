import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { AuthResponse, LoginRequest, User } from './auth.models';
import { environment } from 'environments/environment';
import { setEntrepriseData } from 'app/core/authentication/helpers';
const ACCESS_TOKEN_KEY = 'tms_access_token';
const REFRESH_TOKEN_KEY = 'tms_refresh_token';
const USER_KEY = 'tms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  hasRole(role: string): boolean {
    const user = this.userSignal();
    if (!user || !user.roles) return false;
    // Gère le cas où roles est un tableau de strings ou un tableau d'objets (RolesDto)
    return user.roles.some((r: any) => r === role || r.roleName === role);
  }
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.baseUrl;

  private readonly userSignal = signal<User | null>(this.loadStoredUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getAccessToken() && !!this.userSignal());

  login(request: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((response) => this.persistSession(response)),
      map((response) => response.utilisateur),
      catchError((error) => throwError(() => error))
    );
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.getAccessToken()) {
      this.clearSession();
      return of(null);
    }

    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
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
    // Optionally call backend logout endpoint, ignoring the result
    this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();
    
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

private persistSession(response: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.utilisateur));
  this.userSignal.set(response.utilisateur);

  // ── Ajout : persister les infos entreprise pour getEntrepriseId() ──
 if (response.utilisateur.entrepriseId) {
    setEntrepriseData({ id: response.utilisateur.entrepriseId });
  }
}

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('entrepriseData');
    localStorage.removeItem('tms_access_token');
    // Alternatively, localStorage.clear() could be used but we explicitly remove known auth keys.
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
