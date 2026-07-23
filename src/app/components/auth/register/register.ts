import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordMatchValidator],
    }
  );

  /** Cross-field validator: password must match confirmPassword. */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');

    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear only our custom error if passwords now match
    if (confirm?.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...rest } = confirm.errors;
      confirm.setErrors(Object.keys(rest).length ? rest : null);
    }

    return null;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.isSuccess) {
          this.successMessage.set(
            response.message || 'Account created successfully! Redirecting to login...'
          );
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage.set(response.message || 'Registration failed. Please try again.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const message =
          err.error?.message || 'Unable to connect. Please check your connection and try again.';
        this.errorMessage.set(message);
      },
    });
  }
}
