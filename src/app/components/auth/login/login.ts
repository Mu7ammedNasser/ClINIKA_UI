import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['emailConfirmed'] === 'true') {
        this.successMessage.set('Email confirmed successfully! Please sign in to your account.');
      } else if (params['emailConfirmed'] === 'false') {
        this.errorMessage.set(params['error'] || 'Email confirmation failed. The link may be expired or invalid.');
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (!response.isSuccess) {
          this.errorMessage.set(response.message || 'Invalid email or password.');
        }
        // On success, AuthService.login() handles navigation via navigateByRole()
      },
      error: (err) => {
        this.isLoading.set(false);
        const message =
          err.error?.message ||
          err.error?.Message ||
          (err.status === 400 || err.status === 401
            ? 'Invalid email or password.'
            : 'Unable to connect. Please check your connection and try again.');
        this.errorMessage.set(message);
      },
    });
  }
}
