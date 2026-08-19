import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import {
  DoctorSessionReportDto,
  SessionDiagnosisResultDto,
} from '../../../core/interfaces/session.interfaces';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Data
  reports: DoctorSessionReportDto[] = [];
  filteredReports: DoctorSessionReportDto[] = [];
  isLoading = false;
  errorMessage = '';

  // Search
  searchTerm = '';

  // Direct Lookup
  directSessionIdInput: string = '';

  // Active Detailed Report Modal
  selectedSessionId: number | null = null;
  selectedReport: SessionDiagnosisResultDto | null = null;
  isLoadingDetail = false;
  detailError = '';
  activeDetailTab: 'overview' | 'transcript' | 'medications' | 'investigations' | 'documents' = 'overview';

  ngOnInit(): void {
    this.loadReports();

    // Check if a specific sessionId was requested via query params
    this.route.queryParams.subscribe((params) => {
      const sessionId = params['sessionId'] ? +params['sessionId'] : null;
      if (sessionId) {
        this.openReportDetail(sessionId);
      }
    });
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.sessionService.getDoctorReports(this.searchTerm).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const rawData = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        this.reports = Array.isArray(rawData) ? rawData : [];
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('[Reports] Could not load reports list:', err);
        this.reports = [];
        this.filteredReports = [];
        this.cdr.detectChanges();
      },
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  get isNumericSearch(): boolean {
    const trimmed = this.searchTerm.trim();
    return trimmed.length > 0 && !isNaN(+trimmed);
  }

  searchByDirectSessionId(): void {
    const id = this.searchTerm.trim() ? +this.searchTerm.trim() : (this.directSessionIdInput ? +this.directSessionIdInput : null);
    if (id && !isNaN(id)) {
      this.openReportDetail(id);
    }
  }

  applyFilters(): void {
    let list = [...this.reports];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.sessionId?.toString().includes(term) ||
          (r.patientName && r.patientName.toLowerCase().includes(term)) ||
          (r.finalDiagnosis && r.finalDiagnosis.toLowerCase().includes(term)) ||
          (r.possibleDiagnoses && r.possibleDiagnoses.toLowerCase().includes(term)) ||
          (r.patientSummary && r.patientSummary.toLowerCase().includes(term))
      );
    }

    this.filteredReports = list;
    this.cdr.detectChanges();
  }

  // ─── Detailed Report Modal (/api/Sessions/{sessionId}/diagnosis) ──────────────────

  openReportDetail(sessionId: number): void {
    if (!sessionId) return;
    this.selectedSessionId = sessionId;
    this.selectedReport = null;
    this.isLoadingDetail = true;
    this.detailError = '';
    this.activeDetailTab = 'overview';
    this.cdr.detectChanges();

    this.sessionService.getSessionDiagnosis(sessionId).subscribe({
      next: (res: any) => {
        this.isLoadingDetail = false;
        console.log('[Reports] Diagnosis response for session', sessionId, res);

        const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
        const data = res?.data ?? res?.Data ?? res;

        if (data && typeof data === 'object') {
          this.selectedReport = {
            sessionId: data.sessionId ?? data.SessionId ?? sessionId,
            patientId: data.patientId ?? data.PatientId ?? 0,
            patientName: data.patientName ?? data.PatientName ?? ('Patient of Session #' + sessionId),
            patientGender: data.patientGender ?? data.PatientGender ?? '',
            visitDate: data.visitDate ?? data.VisitDate ?? data.generatedAt ?? data.GeneratedAt ?? new Date().toISOString(),
            status: data.status ?? data.Status ?? 'Completed',
            audioTranscript: data.audioTranscript ?? data.AudioTranscript ?? '',
            extractedSymptoms: data.extractedSymptoms ?? data.ExtractedSymptoms ?? '',
            patientSummary: data.patientSummary ?? data.PatientSummary ?? '',
            possibleDiagnoses: data.possibleDiagnoses ?? data.PossibleDiagnoses ?? '',
            drugInteractions: data.drugInteractions ?? data.DrugInteractions ?? '',
            contraindications: data.contraindications ?? data.Contraindications ?? '',
            suggestedInvestigations: data.suggestedInvestigations ?? data.SuggestedInvestigations ?? '',
            clinicalAlerts: data.clinicalAlerts ?? data.ClinicalAlerts ?? '',
            finalDiagnosis: data.finalDiagnosis ?? data.FinalDiagnosis ?? '',
            generatedAt: data.generatedAt ?? data.GeneratedAt ?? null,
            prescribedMedications: data.prescribedMedications ?? data.PrescribedMedications ?? [],
            visitDocuments: data.visitDocuments ?? data.VisitDocuments ?? [],
          };
          this.detailError = '';
        } else {
          this.detailError = res?.message ?? res?.Message ?? 'Report data not found for this session.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingDetail = false;
        console.error('[Reports] Failed to load session diagnosis:', err);
        let msg = `Session #${sessionId} diagnosis is not available yet or was not found.`;
        if (err.error?.message) {
          msg = err.error.message;
        } else if (err.error?.Message) {
          msg = err.error.Message;
        } else if (err.error?.detail) {
          msg = err.error.detail;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        }
        this.detailError = msg;
        this.cdr.detectChanges();
      },
    });
  }

  closeReportDetail(): void {
    this.selectedSessionId = null;
    this.selectedReport = null;
    this.detailError = '';
    this.cdr.detectChanges();
  }

  setDetailTab(tab: 'overview' | 'transcript' | 'medications' | 'investigations' | 'documents'): void {
    this.activeDetailTab = tab;
    this.cdr.detectChanges();
  }

  // ─── Helpers & Navigation ───────────────────────────────────

  goToInteractionCheck(sessionId: number): void {
    this.router.navigate(['/doctor/sessions/interaction'], {
      queryParams: { sessionId },
    });
  }

  startNewConsultation(): void {
    this.router.navigate(['/doctor/sessions/create']);
  }

  printReport(): void {
    window.print();
  }

  formatDate(dateString?: string | Date): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
