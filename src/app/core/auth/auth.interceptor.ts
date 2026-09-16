import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/api/v1/auth/login');

  // Si le token est déjà expiré localement (hors tentative de login)
  if (token && authService.isTokenExpired(token) && !isAuthEndpoint) {
    authService.logout();
    return throwError(() => new Error('Session expirée'));
  }

  const authReq = token && !isAuthEndpoint
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 Unauthorized ou (403 avec token expiré/invalide) sur une route sécurisée
      if (!isAuthEndpoint && (error.status === 401 || (error.status === 403 && authService.isTokenExpired()))) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
