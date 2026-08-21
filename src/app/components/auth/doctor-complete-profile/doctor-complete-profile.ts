import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly requestId = signal<number | null>(null);
  readonly token = signal<string | null>(null);
  readonly isEmailConfirmed = signal(false);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmittedSuccess = signal(false);

  // File uploads tracking
  readonly files: Record<string, File | null> = {
    personalPhoto: null,
    specialtyCertificationDocument: null,
    medicalDegreeCertificateDocument: null,
    internshipCertificateDocument: null,
    nationalIdDocument: null,
    medicalLicenseDocument: null,
    professionalRegistrationDocument: null,
  };

  readonly profileForm = this.fb.group({
    // Personal Info
    fullNameArabic: ['', [Validators.required, Validators.minLength(3)]],
    dateOfBirth: ['', [Validators.required]],
    gender: ['Male', [Validators.required]],
    nationality: ['Egyptian', [Validators.required]],
    nationalIdOrPassportNumber: ['', [Validators.required, Validators.minLength(8)]],
    country: ['Egypt', [Validators.required]],
    city: ['', [Validators.required]],
    address: ['', [Validators.required]],

    // Medical Info
    medicalProfession: ['Specialist', [Validators.required]],
    primarySpecialty: ['General Medicine', [Validators.required]],
    subSpecialty: [''],
    yearsOfExperience: [1, [Validators.required, Validators.min(0)]],
    medicalLicenseNumber: ['', [Validators.required]],
    licenseIssuingAuthority: ['Ministry of Health', [Validators.required]],
    licenseIssueDate: ['', [Validators.required]],
    licenseExpiryDate: ['', [Validators.required]],
    professionalRegistrationNumber: ['', [Validators.required]],
    professionalRegistrationStatus: ['Active', [Validators.required]],

    // Education
    medicalSchoolOrUniversity: ['', [Validators.required]],
    medicalDegree: ['MBBCh', [Validators.required]],
    graduationYear: [2020, [Validators.required, Validators.min(1950), Validators.max(2030)]],
    internshipStartDate: ['', [Validators.required]],
    internshipEndDate: ['', [Validators.required]],
    postgraduateQualification: [''],
    qualificationName: [''],
    institution: [''],
    yearObtained: [null as number | null],

    // Declarations & Plan
    informationAccuracyConfirmed: [false, [Validators.requiredTrue]],
    termsAndConditionsAgreed: [false, [Validators.requiredTrue]],
    privacyPolicyAgreed: [false, [Validators.requiredTrue]],
    selectedPlan: ['Free', [Validators.required]],
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
      error: (err) => {
        this.isLoading.set(false);
        this.isEmailConfirmed.set(true); // Allow proceeding if already confirmed
      },
    });
  }

  onFileSelected(event: Event, key: string): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.files[key] = target.files[0];
    } else {
      this.files[key] = null;
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage.set('Please fill in all required fields and accept the declarations.');
      return;
    }

    const id = this.requestId();
    if (!id) {
      this.errorMessage.set('Invalid doctor request session. Request ID is missing.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    const raw = this.profileForm.getRawValue();

    // Append regular form fields
    Object.keys(raw).forEach((key) => {
      const val = (raw as Record<string, any>)[key];
      if (val !== null && val !== undefined) {
        formData.append(key, val.toString());
      }
    });

    // Append file attachments
    Object.keys(this.files).forEach((key) => {
      const file = this.files[key];
      if (file) {
        formData.append(key, file, file.name);
      }
    });

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
