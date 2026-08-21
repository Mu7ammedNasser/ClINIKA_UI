import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { SessionService } from '../../../core/services/session.service';
import { PatientSearchDto } from '../../../core/interfaces/patient.interfaces';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-session.html',
  styleUrl: './create-session.css',
})
export class CreateSession implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // Search state
  searchTerm = '';
  patient: PatientSearchDto | null = null;
  isSearching = false;
  searchError = '';

  // Session state
  isCreating = false;
  sessionId: number | null = null;
  sessionCreated = false;
  sessionError = '';

  // Toast
  toastMessage: { type: 'success' | 'error'; text: string } | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const search = params['search'] || params['query'];
      if (search) {
        this.searchTerm = search;
        this.searchPatient();
      }
    });
  }

  searchPatient(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.searchError = 'Please enter a patient National ID.';
      return;
    }

    this.isSearching = true;
    this.searchError = '';
    this.patient = null;
    this.sessionCreated = false;
    this.sessionId = null;
    this.sessionError = '';
    this.cdr.detectChanges();

    this.patientService.searchPatient(term).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.patient = res.data;
        } else {
          this.searchError = res.message || 'No patient found with this National ID.';
        }
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.searchError = err.error?.message || 'No patient found with this National ID.';
        this.isSearching = false;
        this.cdr.detectChanges();
      },
    });
  }

  startSession(): void {
    if (!this.patient) return;

    this.isCreating = true;
    this.sessionError = '';
    this.cdr.detectChanges();

    const patientId = Number(this.patient.id);
    const payload = {
      patientId: patientId,
    };

    console.log('[CreateSession] Sending payload:', payload);

    this.sessionService.createSession(payload).subscribe({
      next: (res) => {
        console.log('[CreateSession] Server response:', res);
        this.isCreating = false;

        if (res.isSuccess) {
          const rawId = res.data;
          const sessionId =
            typeof rawId === 'number'
              ? rawId
              : typeof rawId === 'object' && rawId !== null
              ? (rawId as any).id || (rawId as any).sessionId
              : Number(rawId);

          if (sessionId && !isNaN(sessionId) && sessionId > 0) {
            this.sessionId = sessionId;
            this.sessionCreated = true;
            this.showToast('success', res.message || 'Session created! Navigating to diagnosis...');

            // Directly navigate to the diagnosis stage with audio & documents upload
            setTimeout(() => {
              this.router.navigate(['/doctor/sessions/diagnosis'], {
                queryParams: {
                  sessionId: sessionId,
                  patientName: this.patient?.fullName || '',
                },
              });
            }, 600);
            return;
          }
        }

        this.sessionError = res.message || 'Failed to create session.';
        this.showToast('error', this.sessionError);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[CreateSession] Failed:', err);
        let errorMsg = 'Failed to create session. Please try again.';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.detail) {
          errorMsg = err.error.detail;
        } else if (err.error?.title) {
          errorMsg = err.error.title;
        } else if (typeof err.error === 'string') {
          errorMsg = err.error;
        }
        this.sessionError = errorMsg;
        this.showToast('error', errorMsg);
        this.isCreating = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToDiagnosis(): void {
    if (this.sessionId) {
      this.router.navigate(['/doctor/sessions/diagnosis'], {
        queryParams: { sessionId: this.sessionId, patientName: this.patient?.fullName },
      });
    }
  }

  showToast(type: 'success' | 'error', text: string): void {
    this.toastMessage = { type, text };
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}
