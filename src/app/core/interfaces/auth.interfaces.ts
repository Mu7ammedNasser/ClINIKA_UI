// ─── User Role Enum ──────────────────────────────────────────────
export enum UserRole {
  Doctor = 'Doctor',
  Patient = 'Patient',
  Admin = 'Admin',
}

// ─── Request Interfaces ──────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Response Interfaces ─────────────────────────────────────────
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  status: string;
  message: string;
}
