import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Creates a guard that checks if the authenticated user has at least one of the required roles.
 * Usage: canActivate: [roleGuard(['SUPER_ADMIN'])]
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();
    if (!user) {
      return router.createUrlTree(['/login']);
    }

    const hasRole = allowedRoles.some(role => user.roles.includes(role));
    if (hasRole) {
      return true;
    }

    // Redirect drivers to their portal, others to dashboard
    if (user.roles.includes('DRIVER')) {
      return router.createUrlTree(['/driver-portal']);
    }

    return router.createUrlTree(['/dashboard']);
  };
}
