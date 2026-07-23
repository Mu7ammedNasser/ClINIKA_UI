import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces/auth.interfaces';

/**
 * Restricts access based on the user's role.
 *
 * Usage in route config:
 * ```ts
 * {
 *   path: 'doctor',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: [UserRole.Doctor] },
 *   ...
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const userRole = authService.getUserRole();

  if (userRole && allowedRoles?.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
