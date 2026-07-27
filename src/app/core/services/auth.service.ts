import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

import { environment } from '../enviroments/environment';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthUser,
  ApiResponse,
  UserRole,
} from '../interfaces/auth.interfaces';

// Keys used in localStorage
const TOKEN_KEY = 'clinika_token';
const USER_KEY = 'clinika_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl;

  // ─── Auth API Methods ────────────────────────────────────────

  /**
   * Authenticates the user and persists token + user data on success.
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthUser>> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.apiUrl}/Auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            if (response.data.token) {
              this.saveToken(response.data.token);
            }
            this.saveUser(response.data);
            this.navigateByRole();
          }
        })
      );
  }

  /**
   * Registers a new user account.
   */
  register(data: RegisterRequest): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(
      `${this.apiUrl}/Auth/register`,
      data
    );
  }

  /**
   * Sends a forgot‑password request.
   * TODO: Replace the placeholder URL with your actual endpoint.
   */
  forgotPassword(
    data: ForgotPasswordRequest
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/Auth/forgot-password`,
      data
    );
  }

  /**
   * Resets the user's password using a token received via email.
   * TODO: Replace the placeholder URL with your actual endpoint.
   */
  resetPassword(
    data: ResetPasswordRequest
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/Auth/reset-password`,
      data
    );
  }

  /**
   * Clears local auth state and redirects to the login page.
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.router.navigate(['/login']);
  }

  // ─── Token Management ────────────────────────────────────────

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  /**
   * Returns `true` when a non‑expired JWT exists in storage.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      const exp = payload['exp'] as number | undefined;
      if (!exp) {
        return false;
      }
      // exp is in seconds; Date.now() is in milliseconds
      const isExpired = exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  // ─── User / Role Helpers ─────────────────────────────────────

  /**
   * Extracts the user role from the JWT claims.
   */
  getUserRole(): UserRole | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      // ASP.NET Identity role claim key
      const roleClaim =
        payload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] as string | undefined;

      if (roleClaim && Object.values(UserRole).includes(roleClaim as UserRole)) {
        return roleClaim as UserRole;
      }
      return null;
    } catch {
      return null;
    }
  }

  getUser(): AuthUser | null {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as AuthUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private saveUser(user: AuthUser): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Base64url‑decodes the JWT payload (no external library needed).
   */
  private decodeToken(token: string): Record<string, unknown> {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  }

  /**
   * Redirects the user to their role‑specific dashboard after login.
   */
  private navigateByRole(): void {
    const role = this.getUserRole();
    switch (role) {
      case UserRole.Doctor:
        this.router.navigate(['/doctor/dashboard']);
        break;
      case UserRole.Patient:
        this.router.navigate(['/patient/dashboard']);
        break;
      case UserRole.Admin:
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}
