import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const isAuthEndpoint = req.url.includes('/auth/login') ||
                         req.url.includes('/api/v1/auth/login') ||
                         req.url.includes('/auth/refresh') ||
                         req.url.includes('/api/v1/auth/refresh');

  // Si le token est expiré localement mais qu'on a un refresh token
  if (token && authService.isTokenExpired(token) && !isAuthEndpoint) {
    return authService.refreshToken().pipe(
      switchMap((authResponse) => {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${authResponse.accessToken}`
          }
        });
        return next(clonedReq);
      }),
      catchError((err) => {
        authService.logout();
        return throwError(() => err);
      })
    );
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
      // Si 401 Unauthorized sur une route sécurisée, tenter le refresh token
      if (!isAuthEndpoint && error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((authResponse) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authResponse.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      if (!isAuthEndpoint && error.status === 403 && authService.isTokenExpired()) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
