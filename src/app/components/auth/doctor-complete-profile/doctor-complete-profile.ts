import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DoctorRequestService } from '../../../core/services/doctor-request.service';

@Component({
  selector: 'app-doctor-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './doctor-complete-profile.html',
  styleUrl: './doctor-complete-profile.css',
})
export class DoctorCompleteProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly doctorRequestService = inject(DoctorRequestService);
  private readonly route = inject(ActivatedRoute);

  readonly requestId = signal<number | null>(null);
  readonly token = signal<string | null>(null);
  readonly isEmailConfirmed = signal(false);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmittedSuccess = signal(false);

  personalPhotoFile: File | null = null;
  personalPhotoPreview = signal<string | null>(null);

  readonly profileForm = this.fb.group({
    fullNameArabic: [''],
    primarySpecialty: [''],
    yearsOfExperience: [null as number | null],
    medicalLicenseNumber: [''],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['requestId'] ? parseInt(params['requestId'], 10) : null;
      const tok = params['token'] || null;
      const confirmed = params['confirmed'] === 'true';

      this.requestId.set(id);
      this.token.set(tok);

      if (id && tok && !confirmed) {
        this.confirmEmailToken(id, tok);
      } else if (confirmed || id) {
        this.isEmailConfirmed.set(true);
      }
    });
  }

  confirmEmailToken(id: number, tok: string): void {
    this.isLoading.set(true);
    this.doctorRequestService.confirmEmail({ requestId: id, token: tok }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isEmailConfirmed.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        this.isEmailConfirmed.set(true); // Allow proceeding if already confirmed
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.personalPhotoFile = target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.personalPhotoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(this.personalPhotoFile);
    } else {
      this.personalPhotoFile = null;
      this.personalPhotoPreview.set(null);
    }
  }

  onSubmit(): void {
    const id = this.requestId();
    if (!id) {
      this.errorMessage.set('Invalid doctor request session. Request ID is missing.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    const raw = this.profileForm.getRawValue();

    if (raw.fullNameArabic?.trim()) {
      formData.append('fullNameArabic', raw.fullNameArabic.trim());
    }

    if (raw.primarySpecialty?.trim()) {
      formData.append('primarySpecialty', raw.primarySpecialty.trim());
    }

    if (raw.yearsOfExperience !== null && raw.yearsOfExperience !== undefined) {
      formData.append('yearsOfExperience', raw.yearsOfExperience.toString());
    }

    if (raw.medicalLicenseNumber?.trim()) {
      formData.append('medicalLicenseNumber', raw.medicalLicenseNumber.trim());
    }

    if (this.personalPhotoFile) {
      formData.append('personalPhoto', this.personalPhotoFile, this.personalPhotoFile.name);
    }

    this.doctorRequestService.completeProfile(id, formData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.isSuccess) {
          this.isSubmittedSuccess.set(true);
        } else {
          this.errorMessage.set(res.message || 'Submission failed.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.error?.errors) {
          const firstKey = Object.keys(err.error.errors)[0];
          this.errorMessage.set(err.error.errors[firstKey][0]);
          return;
        }
        this.errorMessage.set(
          err.error?.message || 'An error occurred while uploading your doctor profile.'
        );
      },
    });
  }
}
