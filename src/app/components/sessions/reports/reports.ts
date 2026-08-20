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
  activeDetailTab: 'top-diagnoses' | 'clinical-findings' | 'investigations' | 'transcript' | 'medications' | 'documents' = 'top-diagnoses';

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
    this.activeDetailTab = 'top-diagnoses';
    this.cdr.detectChanges();

    this.sessionService.getSessionDiagnosis(sessionId).subscribe({
      next: (res: any) => {
        this.isLoadingDetail = false;
        console.log('[Reports] Diagnosis response for session', sessionId, res);

        const isSuccess = res?.isSuccess ?? res?.IsSuccess ?? true;
        const rootData = res?.data ?? res?.Data ?? res;
        const body = rootData?.body ?? rootData?.Body ?? rootData;

        if (body && typeof body === 'object') {
          // Parse internal analysis JSON if present for deep fallback, but NEVER expose raw analysis string to UI
          let parsedAnalysis: any = null;
          if (body.analysis && typeof body.analysis === 'string') {
            try {
              parsedAnalysis = JSON.parse(body.analysis);
            } catch (e) {
              console.warn('[Reports] Analysis JSON parse warning:', e);
            }
          } else if (body.analysis && typeof body.analysis === 'object') {
            parsedAnalysis = body.analysis;
          }

          // 1. Top 5 Differential Diagnoses
          let top5 =
            body['Top 5 Differential Diagnoses'] ??
            body.top5DifferentialDiagnoses ??
            body.topDifferentialDiagnoses ??
            body['top_5_differential_diagnoses'] ??
            parsedAnalysis?.['Top 5 Differential Diagnoses'] ??
            parsedAnalysis?.top5DifferentialDiagnoses ??
            [];
          if (typeof top5 === 'string') {
            top5 = top5
              .split(/\r?\n/)
              .map((s: string) => s.replace(/^\d+[\.\-\)]\s*/, '').trim())
              .filter(Boolean);
          } else if (!Array.isArray(top5)) {
            top5 = [];
          }

          // 2. Recommended Investigations
          let investigations =
            body['Recommended Investigations'] ??
            body.recommendedInvestigations ??
            body.recommendedInvestigationsList ??
            parsedAnalysis?.['Recommended Investigations'] ??
            parsedAnalysis?.recommendedInvestigations ??
            [];
          if (typeof investigations === 'string') {
            investigations = investigations
              .split(/\r?\n/)
              .map((s: string) => s.replace(/^\d+[\.\-\)]\s*/, '').trim())
              .filter(Boolean);
          } else if (!Array.isArray(investigations)) {
            investigations = [];
          }

          // 3. Chief Complaint
          const chiefComplaint =
            body['Chief Complaint'] ??
            body.chiefComplaint ??
            parsedAnalysis?.['Chief Complaint'] ??
            rootData?.extractedSymptoms ??
            '';

          // 4. History of Present Illness
          const historyOfPresentIllness =
            body['History of Present Illness'] ??
            body.historyOfPresentIllness ??
            parsedAnalysis?.['History of Present Illness'] ??
            rootData?.patientSummary ??
            '';

          // 5. Complete Findings From All Medical Images
          const completeMedicalImageFindings =
            body['Complete Findings From All Medical Images'] ??
            body.completeMedicalImageFindings ??
            parsedAnalysis?.['Complete Findings From All Medical Images'] ??
            '';

          // 6. Possible Diagnosis
          const possibleDiagnosis =
            body['Possible Diagnosis'] ??
            body.possibleDiagnosis ??
            body.possibleDiagnoses ??
            rootData?.possibleDiagnoses ??
            parsedAnalysis?.['Possible Diagnosis'] ??
            '';

          // 7. Immediate Management
          const immediateManagement =
            body['Immediate Management'] ??
            body.immediateManagement ??
            parsedAnalysis?.['Immediate Management'] ??
            '';

          // 8. Images Received
          const imagesReceived =
            body.images_received ??
            body.imagesReceived ??
            parsedAnalysis?.images_received ??
            0;

          // 9. Audio Transcript
          const audioTranscript =
            body.transcript ??
            body.audioTranscript ??
            rootData?.audioTranscript ??
            '';

          this.selectedReport = {
            sessionId: rootData.sessionId ?? rootData.SessionId ?? sessionId,
            patientId: rootData.patientId ?? rootData.PatientId ?? 0,
            patientName: rootData.patientName ?? rootData.PatientName ?? ('Patient of Session #' + sessionId),
            patientGender: rootData.patientGender ?? rootData.PatientGender ?? '',
            visitDate: rootData.visitDate ?? rootData.VisitDate ?? rootData.generatedAt ?? rootData.GeneratedAt ?? new Date().toISOString(),
            status: rootData.status ?? rootData.Status ?? 'Completed',
            audioTranscript,
            extractedSymptoms: chiefComplaint || (rootData.extractedSymptoms ?? ''),
            patientSummary: historyOfPresentIllness || (rootData.patientSummary ?? ''),
            possibleDiagnoses: possibleDiagnosis,
            possibleDiagnosis,
            top5DifferentialDiagnoses: top5,
            chiefComplaint,
            historyOfPresentIllness,
            completeMedicalImageFindings,
            recommendedInvestigationsList: investigations,
            immediateManagement,
            imagesReceived,
            drugInteractions: rootData.drugInteractions ?? rootData.DrugInteractions ?? '',
            contraindications: rootData.contraindications ?? rootData.Contraindications ?? '',
            suggestedInvestigations: investigations.length > 0 ? investigations.join(', ') : (rootData.suggestedInvestigations ?? rootData.SuggestedInvestigations ?? ''),
            clinicalAlerts: rootData.clinicalAlerts ?? rootData.ClinicalAlerts ?? '',
            finalDiagnosis: rootData.finalDiagnosis ?? rootData.FinalDiagnosis ?? '',
            generatedAt: rootData.generatedAt ?? rootData.GeneratedAt ?? null,
            prescribedMedications: rootData.prescribedMedications ?? rootData.PrescribedMedications ?? body.prescribedMedications ?? [],
            visitDocuments: rootData.visitDocuments ?? rootData.VisitDocuments ?? body.visitDocuments ?? [],
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

  setDetailTab(tab: 'top-diagnoses' | 'clinical-findings' | 'investigations' | 'transcript' | 'medications' | 'documents'): void {
    this.activeDetailTab = tab;
    this.cdr.detectChanges();
  }

  asArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
    if (typeof val === 'string') {
      return val
        .split(/\r?\n/)
        .map((s) => s.replace(/^\d+[\.\-\)]\s*/, '').trim())
        .filter(Boolean);
    }
    return [];
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
