import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  if (token && authService.isTokenExpired(token)) {
    authService.logout();
    return router.createUrlTree(['/login']);
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.loadCurrentUser().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login'])))
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
