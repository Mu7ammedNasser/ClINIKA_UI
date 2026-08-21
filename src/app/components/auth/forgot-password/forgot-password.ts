import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmittedSuccess = signal(false);
  readonly submittedEmail = signal('');

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.forgotForm.getRawValue().email.trim();
    this.submittedEmail.set(email);

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.isSuccess) {
          this.isSubmittedSuccess.set(true);
        } else {
          this.errorMessage.set(
            response.message ||
              'Unable to send password reset link. Please check the email and try again.'
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const message =
          err.error?.message ||
          err.error?.Message ||
          'Unable to connect to authentication service. Please check your network and try again.';
        this.errorMessage.set(message);
      },
    });
  }
}
