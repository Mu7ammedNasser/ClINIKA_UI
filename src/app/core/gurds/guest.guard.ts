import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces/auth.interfaces';

/**
 * Prevents already‑authenticated users from accessing guest‑only
 * routes (login, register, forgot‑password, reset‑password).
 * Redirects them to their role‑specific dashboard instead.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is already logged in — send them to their dashboard
  const role = authService.getUserRole();

  switch (role) {
    case UserRole.Doctor:
      return router.createUrlTree(['/doctor/dashboard']);
    case UserRole.Patient:
      return router.createUrlTree(['/patient/dashboard']);
    case UserRole.Admin:
      return router.createUrlTree(['/admin/dashboard']);
    default:
      return router.createUrlTree(['/login']);
  }
};
