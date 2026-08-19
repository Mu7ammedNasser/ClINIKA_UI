import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { PatientService } from '../../../core/services/patient.service';
import {
  DrugConflictItem,
  DrugInteractionData,
  PrescribedMedicationDto,
  SessionDiagnosisResultDto,
} from '../../../core/interfaces/session.interfaces';
import {
  PatientHistoryDto,
  MedicationDto,
} from '../../../core/interfaces/patient.interfaces';

@Component({
  selector: 'app-interaction-check',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interaction-check.html',
  styleUrl: './interaction-check.css',
})
export class InteractionCheck implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly patientService = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Session & Patient State
  sessionId: number | null = null;
  manualSessionInput: string = '';
  patientId: number | null = null;
  patientName: string = '';
  patientGender: string = '';
  patientHistory: PatientHistoryDto | null = null;

  // Medications State
  activeMedications: MedicationDto[] = [];
  prescribedMedications: PrescribedMedicationDto[] = [];

  // Loading States
  isLoadingData: boolean = false;
  isCheckingInteractions: boolean = false;
  errorMessage: string = '';

  // Interaction Analysis Results
  interactionResult: DrugInteractionData | null = null;
  hasChecked: boolean = false;

  // Toast
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['sessionId'] ? +params['sessionId'] : null;
      if (id && !isNaN(id)) {
        this.sessionId = id;
        this.loadSessionData(id);
      }
    });
  }

  loadSessionData(sessionId: number): void {
    this.sessionId = sessionId;
    this.isLoadingData = true;
    this.errorMessage = '';
    this.interactionResult = null;
    this.hasChecked = false;
    this.cdr.detectChanges();

    // 1. Fetch Session details to get Patient ID and Prescribed Meds
    this.sessionService.getSessionDiagnosis(sessionId).subscribe({
      next: (res: any) => {
        const data: SessionDiagnosisResultDto = res?.data ?? res?.Data ?? res;
        if (data && (data.sessionId || (data as any).SessionId)) {
          this.patientId = data.patientId ?? (data as any).PatientId;
          this.patientName = data.patientName ?? (data as any).PatientName ?? 'Patient';
          this.patientGender = data.patientGender ?? (data as any).PatientGender ?? '';
          this.prescribedMedications = data.prescribedMedications ?? (data as any).PrescribedMedications ?? [];

          // 2. Fetch Patient History for Active Medications
          if (this.patientId) {
            this.loadPatientHistory(this.patientId);
          } else {
            this.isLoadingData = false;
            this.cdr.detectChanges();
          }
        } else {
          // Fallback: try loading prescribed medications directly
          this.loadPrescribedOnly(sessionId);
        }
      },
      error: (err) => {
        console.warn('Could not load session diagnosis details, trying direct prescribed endpoint:', err);
        this.loadPrescribedOnly(sessionId);
      },
    });
  }

  private loadPrescribedOnly(sessionId: number): void {
    this.sessionService.getPrescribedMedications(sessionId).subscribe({
      next: (res: any) => {
        this.prescribedMedications = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingData = false;
        console.error('Failed to load session info:', err);
        this.errorMessage = `Session #${sessionId} was not found or has no medications recorded.`;
        this.cdr.detectChanges();
      },
    });
  }

  private loadPatientHistory(patientId: number): void {
    this.patientService.getPatientHistory(patientId).subscribe({
      next: (res: any) => {
        this.isLoadingData = false;
        const history: PatientHistoryDto = res?.data ?? res?.Data ?? res;
        if (history) {
          this.patientHistory = history;
          this.activeMedications = history.activeMedications ?? [];
          if (!this.patientName && history.fullName) {
            this.patientName = history.fullName;
          }
          if (!this.patientGender && history.gender) {
            this.patientGender = history.gender;
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingData = false;
        console.error('Failed to load patient history:', err);
        this.cdr.detectChanges();
      },
    });
  }

  onManualLookup(): void {
    if (this.manualSessionInput === null || this.manualSessionInput === undefined || this.manualSessionInput === '') {
      return;
    }
    const raw = String(this.manualSessionInput).trim();
    const id = Number(raw);
    if (!isNaN(id) && id > 0) {
      this.sessionId = id;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sessionId: id },
        queryParamsHandling: 'merge',
      });
      this.loadSessionData(id);
    }
  }

  runInteractionCheck(): void {
    if (!this.sessionId) return;

    this.isCheckingInteractions = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.sessionService.triggerInteractionCheck(this.sessionId).subscribe({
      next: (res: any) => {
        this.isCheckingInteractions = false;
        this.hasChecked = true;

        // Parse response from trigger-interaction-check
        // Expected shape: { data: { status: "conflict", conflicts: [...] }, isSuccess: true }
        const rawData = res?.data ?? res?.Data ?? res;
        if (rawData) {
          const status = rawData.status ?? rawData.Status ?? 'safe';
          const conflicts: DrugConflictItem[] = rawData.conflicts ?? rawData.Conflicts ?? [];

          this.interactionResult = {
            status,
            conflicts,
          };

          if (this.hasConflicts) {
            this.showToast('error', `AI Warning: ${this.conflictsCount} drug interaction conflict(s) detected!`);
          } else {
            this.showToast('success', 'AI Verification Passed: No drug interaction conflicts detected.');
          }
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isCheckingInteractions = false;
        this.hasChecked = true;
        console.error('Interaction check failed:', err);

        let msg = 'Failed to analyze drug interactions. Please try again.';
        if (err.error?.message) {
          msg = err.error.message;
        } else if (err.error?.Message) {
          msg = err.error.Message;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }

        this.errorMessage = msg;
        this.showToast('error', msg);
        this.cdr.detectChanges();
      },
    });
  }

  // Getters
  get hasConflicts(): boolean {
    if (!this.interactionResult) return false;
    const status = this.interactionResult.status?.toLowerCase();
    return status === 'conflict' || (this.interactionResult.conflicts && this.interactionResult.conflicts.length > 0);
  }

  get conflictsCount(): number {
    return this.interactionResult?.conflicts?.length ?? 0;
  }

  get isSafe(): boolean {
    if (!this.interactionResult || !this.hasChecked) return false;
    return !this.hasConflicts;
  }

  formatScore(score?: number): string {
    if (score === undefined || score === null) return 'High';
    return (score * 100).toFixed(1) + '%';
  }

  // Navigation
  goToDiagnosis(): void {
    if (this.sessionId) {
      this.router.navigate(['/doctor/sessions/diagnosis'], {
        queryParams: { sessionId: this.sessionId },
      });
    }
  }

  goToReports(): void {
    if (this.sessionId) {
      this.router.navigate(['/doctor/sessions/reports'], {
        queryParams: { sessionId: this.sessionId },
      });
    } else {
      this.router.navigate(['/doctor/sessions/reports']);
    }
  }

  printReport(): void {
    window.print();
  }

  showToast(type: 'success' | 'error' | 'info', text: string): void {
    this.toastMessage = { type, text };
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 6000);
  }
}
