import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DoctorRequestService } from '../../../core/services/doctor-request.service';

@Component({
  selector: 'app-register-doctor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-doctor.html',
  styleUrl: './register-doctor.css',
})
export class RegisterDoctor {
  private readonly fb = inject(FormBuilder);
  private readonly doctorRequestService = inject(DoctorRequestService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmittedSuccess = signal(false);
  readonly registeredEmail = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly doctorForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordMatchValidator],
    }
  );

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');

    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }

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
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValues = this.doctorForm.getRawValue();
    this.registeredEmail.set(formValues.email);

    this.doctorRequestService.submitInitialRequest(formValues).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.isSuccess) {
          this.isSubmittedSuccess.set(true);
        } else {
          this.errorMessage.set(
            response.message || 'Doctor registration failed. Please try again.'
          );
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.errors) {
          const firstKey = Object.keys(err.error.errors)[0];
          this.errorMessage.set(err.error.errors[firstKey][0]);
          return;
        }
        const message =
          err.error?.message ||
          'Unable to submit doctor request. Please verify your data and connection.';
        this.errorMessage.set(message);
      },
    });
  }
}
