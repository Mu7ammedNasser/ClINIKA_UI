import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SessionService } from '../../../core/services/session.service';
import { PatientService } from '../../../core/services/patient.service';
import {
  DrugConflictItem,
  DrugInteractionData,
  PrescribeMedicationRequest,
  PrescribedMedicationDto,
  SessionDiagnosisResultDto,
  SessionDocumentDto,
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
  private readonly sanitizer = inject(DomSanitizer);

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

  // Visit Documents State
  visitDocuments: SessionDocumentDto[] = [];

  // Loading & Action States
  isLoadingData: boolean = false;
  isCheckingInteractions: boolean = false;
  isFinalizing: boolean = false;
  isFinalized: boolean = false;
  errorMessage: string = '';

  // Interaction Analysis Results
  interactionResult: DrugInteractionData | null = null;
  hasChecked: boolean = false;

  // Edit Prescriptions State
  isEditingPrescriptions: boolean = false;
  isSavingPrescriptions: boolean = false;
  editableMedications: PrescribeMedicationRequest[] = [];

  // Toast
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['sessionId'] ? +params['sessionId'] : null;
      const pId = params['patientId'] ? +params['patientId'] : null;
      if (id && !isNaN(id)) {
        this.sessionId = id;
        this.loadSessionData(id, pId);
      }
    });
  }

  loadSessionData(sessionId: number, queryPatientId?: number | null): void {
    this.sessionId = sessionId;
    this.isLoadingData = true;
    this.errorMessage = '';
    this.interactionResult = null;
    this.hasChecked = false;
    this.isFinalized = false;
    this.isEditingPrescriptions = false;
    this.cdr.detectChanges();

    // 1. Fetch Prescriptions for this Session via GET /api/Sessions/{sessionId}/prescribe
    this.sessionService.getPrescribedMedications(sessionId).subscribe({
      next: (res: any) => {
        const meds: PrescribedMedicationDto[] = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        this.prescribedMedications = meds;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load prescribed medications:', err);
      },
    });

    // 2. Resolve Patient ID and fetch Patient History via GET /api/Patient/history/{id}
    if (queryPatientId && queryPatientId > 0) {
      this.patientId = queryPatientId;
      this.loadPatientHistory(queryPatientId);
    } else {
      // Lookup doctor reports to retrieve patient metadata associated with this session
      this.sessionService.getDoctorReports(sessionId.toString()).subscribe({
        next: (res: any) => {
          const reports = res?.data ?? res?.Data ?? [];
          const sessionReport = reports.find((r: any) => r.sessionId === sessionId || r.SessionId === sessionId);
          if (sessionReport) {
            this.patientId = sessionReport.patientId ?? sessionReport.PatientId;
            this.patientName = sessionReport.patientName ?? sessionReport.PatientName ?? '';
            this.patientGender = sessionReport.patientGender ?? sessionReport.PatientGender ?? '';
            if (this.patientId) {
              this.loadPatientHistory(this.patientId);
              return;
            }
          }
          // If not found in query search, fallback to all doctor reports
          this.sessionService.getDoctorReports().subscribe({
            next: (allRes: any) => {
              const allReports = allRes?.data ?? allRes?.Data ?? [];
              const found = allReports.find((r: any) => r.sessionId === sessionId || r.SessionId === sessionId);
              if (found) {
                this.patientId = found.patientId ?? found.PatientId;
                this.patientName = found.patientName ?? found.PatientName ?? '';
                this.patientGender = found.patientGender ?? found.PatientGender ?? '';
                if (this.patientId) {
                  this.loadPatientHistory(this.patientId);
                  return;
                }
              }
              this.isLoadingData = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoadingData = false;
              this.cdr.detectChanges();
            },
          });
        },
        error: (err) => {
          console.error('Failed to resolve patient for session:', err);
          this.isLoadingData = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  loadPatientHistory(patientId: number): void {
    // GET /api/Patient/history/{id}
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

  // ─── AI Interaction Check ──────────────────────────────────────

  runInteractionCheck(): void {
    if (!this.sessionId) return;

    this.isCheckingInteractions = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.sessionService.triggerInteractionCheck(this.sessionId).subscribe({
      next: (res: any) => {
        this.isCheckingInteractions = false;
        this.hasChecked = true;

        const rawData = res?.data ?? res?.Data ?? res;
        if (rawData) {
          const status = rawData.status ?? rawData.Status ?? 'safe';
          const conflicts: DrugConflictItem[] = rawData.conflicts ?? rawData.Conflicts ?? [];
          const visitDocument: string = rawData.visitDocument ?? rawData.VisitDocument ?? '';

          this.interactionResult = {
            status,
            conflicts,
            visitDocument,
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

  // ─── Option 1: Save & Finish Treatment ────────────────────────

  saveAndFinish(): void {
    if (!this.sessionId) return;

    this.isFinalizing = true;
    this.cdr.detectChanges();

    this.sessionService.finalizeTreatment(this.sessionId).subscribe({
      next: (res: any) => {
        this.isFinalizing = false;
        this.isFinalized = true;
        this.showToast(
          'success',
          'Treatment plan finalized! Prescriptions added to patient active medications.'
        );

        // Refresh patient active medications to reflect the newly saved treatments
        if (this.patientId) {
          this.loadPatientHistory(this.patientId);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isFinalizing = false;
        console.error('Failed to finalize treatment:', err);
        let msg = 'Failed to finalize treatment plan. Please try again.';
        if (err.error?.message) {
          msg = err.error.message;
        } else if (err.error?.Message) {
          msg = err.error.Message;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }
        this.showToast('error', msg);
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Option 2: Edit Prescriptions & Re-check ──────────────────

  startEditingPrescriptions(): void {
    this.editableMedications = this.prescribedMedications.map((m) => ({
      id: m.id,
      drugName: m.drugName,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      notes: m.notes || '',
    }));

    if (this.editableMedications.length === 0) {
      this.addPrescriptionRow();
    }

    this.isEditingPrescriptions = true;
    this.cdr.detectChanges();
  }

  cancelEditingPrescriptions(): void {
    this.isEditingPrescriptions = false;
    this.cdr.detectChanges();
  }

  addPrescriptionRow(): void {
    this.editableMedications.push({
      drugName: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
    });
    this.cdr.detectChanges();
  }

  removePrescriptionRow(index: number): void {
    this.editableMedications.splice(index, 1);
    this.cdr.detectChanges();
  }

  deleteSinglePrescription(medicationId?: number): void {
    if (!this.sessionId || !medicationId) return;

    this.sessionService.deletePrescribedMedication(this.sessionId, medicationId).subscribe({
      next: () => {
        this.showToast('info', 'Medication removed successfully.');
        if (this.sessionId) {
          this.sessionService.getPrescribedMedications(this.sessionId).subscribe({
            next: (res: any) => {
              this.prescribedMedications = res?.data ?? res?.Data ?? [];
              this.cdr.detectChanges();
            },
          });
        }
      },
      error: (err: any) => {
        console.error('Failed to delete medication:', err);
        this.showToast('error', 'Failed to remove medication.');
      },
    });
  }

  saveAndRecheckInteractions(): void {
    if (!this.sessionId) return;

    const validMeds = this.editableMedications.filter(
      (m) => m.drugName && m.drugName.trim().length > 0
    );

    if (validMeds.length === 0) {
      this.showToast('error', 'Please provide at least one medication name.');
      return;
    }

    this.isSavingPrescriptions = true;
    this.cdr.detectChanges();

    this.sessionService.updatePrescribedMedications(this.sessionId, validMeds).subscribe({
      next: (res: any) => {
        this.isSavingPrescriptions = false;
        this.isEditingPrescriptions = false;
        const saved: PrescribedMedicationDto[] = res?.data ?? res?.Data ?? [];
        this.prescribedMedications = saved;
        this.showToast('success', 'Prescriptions updated! Re-running interaction check...');

        // Immediately trigger the AI conflict re-check with the new medications
        this.runInteractionCheck();
      },
      error: (err: any) => {
        this.isSavingPrescriptions = false;
        console.error('Failed to update prescriptions:', err);
        let msg = 'Failed to update prescriptions.';
        if (err.error?.message) {
          msg = err.error.message;
        } else if (err.error?.Message) {
          msg = err.error.Message;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }
        this.showToast('error', msg);
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Getters & Helpers ────────────────────────────────────────

  get hasConflicts(): boolean {
    if (!this.interactionResult) return false;
    const status = this.interactionResult.status?.toLowerCase();
    if (status === 'no_conflict' || status === 'safe' || status === 'noconflict') {
      return false;
    }
    return status === 'conflict' || (!!this.interactionResult.conflicts && this.interactionResult.conflicts.length > 0);
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

  isPdf(filePath?: string): boolean {
    return !!filePath && filePath.toLowerCase().endsWith('.pdf');
  }

  copyVisitNote(): void {
    const doc = this.interactionResult?.visitDocument;
    if (!doc) return;
    navigator.clipboard.writeText(doc).then(() => {
      this.showToast('success', 'Clinical visit note copied to clipboard!');
    }).catch(() => {
      this.showToast('error', 'Failed to copy to clipboard.');
    });
  }

  renderMarkdown(content?: string): SafeHtml {
    if (!content) return '';

    // 1. Normalize line breaks and Unicode non-breaking spaces (e.g. \u202F, \u00A0)
    let raw = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u202F\u00A0]/g, ' ');

    // 2. Escape HTML
    raw = this.escapeHtml(raw);

    // 3. Horizontal rules
    raw = raw.replace(/^---$/gm, '<hr class="visit-note-divider" />');

    // 4. Highlight specific Clinical Titles and Section headers
    raw = raw.replace(
      /\*\*(Clinical Visit Note)\*\*/gi,
      '<div class="visit-note-title">$1</div>'
    );

    raw = raw.replace(
      /\*\*(Subjective|Objective|Assessment & Differential Diagnosis|Plan \/ Next Steps|Current Medications):\*\*/gi,
      '<div class="clinical-section-header"><span class="section-indicator"></span><span class="section-title-text">$1</span></div>'
    );

    // 5. Bold & Italic markdown formatting
    raw = raw.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-gray-900"><em class="text-indigo-900">$1</em></strong>');
    raw = raw.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    raw = raw.replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>');

    // 6. Numbered list items (e.g. 1. Primary headache...)
    raw = raw.replace(
      /^(\d+)\.\s+(.*)$/gm,
      '<div class="clinical-numbered-item"><span class="item-number">$1</span><div class="item-text">$2</div></div>'
    );

    // 7. Bullet list items (e.g. - Panadol...)
    raw = raw.replace(
      /^-\s+(.*)$/gm,
      '<div class="clinical-bullet-item"><span class="bullet-dot"></span><div class="item-text">$1</div></div>'
    );

    // 8. Format multi-line spacing
    raw = raw.replace(/\n\n/g, '<div class="h-2.5"></div>');
    raw = raw.replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  startNewConsultation(): void {
    this.router.navigate(['/doctor/sessions/create']);
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
