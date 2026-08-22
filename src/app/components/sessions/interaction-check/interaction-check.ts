import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SessionService } from '../../../core/services/session.service';
import { PatientService } from '../../../core/services/patient.service';
import {
  DoctorSessionReportDto,
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
  private readonly sanitizer = inject(DomSanitizer);
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
  currentDate: Date = new Date();

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
    this.isFinalized = false;
    this.isEditingPrescriptions = false;
    this.cdr.detectChanges();

    // 1. Fetch Prescribed Medications directly for this session
    this.sessionService.getPrescribedMedications(sessionId).subscribe({
      next: (res: any) => {
        const meds = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(meds) && meds.length > 0) {
          this.prescribedMedications = meds;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('[InteractionCheck] Could not load prescribed meds endpoint:', err);
      },
    });

    // 2. Fetch Session Diagnosis details (Patient ID, Visit Documents, AI details, Active Meds)
    this.sessionService.getSessionDiagnosis(sessionId).subscribe({
      next: (res: any) => {
        const dataObj = res?.data ?? res?.Data ?? res;
        const body = dataObj?.body ?? dataObj?.Body ?? dataObj;

        const pId = dataObj.patientId ?? dataObj.PatientId ?? body.patientId ?? body.PatientId ?? 0;
        const pName = dataObj.patientName ?? dataObj.PatientName ?? body.patientName ?? body.PatientName ?? '';
        const pGender = dataObj.patientGender ?? dataObj.PatientGender ?? body.patientGender ?? body.PatientGender ?? '';
        const prescribed = dataObj.prescribedMedications ?? dataObj.PrescribedMedications ?? body.prescribedMedications ?? body.PrescribedMedications ?? [];
        const active = dataObj.activeMedications ?? dataObj.ActiveMedications ?? body.activeMedications ?? body.ActiveMedications ?? [];
        const docs = dataObj.visitDocuments ?? dataObj.VisitDocuments ?? body.visitDocuments ?? body.VisitDocuments ?? [];

        if (Array.isArray(prescribed) && prescribed.length > 0) {
          this.prescribedMedications = prescribed;
        }
        if (Array.isArray(active) && active.length > 0) {
          this.activeMedications = active;
        }
        if (Array.isArray(docs) && docs.length > 0) {
          this.visitDocuments = docs;
        }
        if (pName) {
          this.patientName = pName;
        }
        if (pGender) {
          this.patientGender = pGender;
        }

        if (pId > 0) {
          this.patientId = pId;
          this.loadPatientHistory(pId);
        } else {
          // Fallback: lookup session in doctor reports list to find patientId
          this.lookupPatientIdFromReports(sessionId);
        }
      },
      error: (err) => {
        console.warn('[InteractionCheck] Could not load session diagnosis details:', err);
        // Fallback: lookup session in doctor reports list
        this.lookupPatientIdFromReports(sessionId);
      },
    });
  }

  private lookupPatientIdFromReports(sessionId: number): void {
    this.sessionService.getDoctorReports(sessionId.toString()).subscribe({
      next: (res: any) => {
        const list: DoctorSessionReportDto[] = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        const match = Array.isArray(list) ? list.find((r) => r.sessionId === sessionId) : null;
        if (match && match.patientId > 0) {
          this.patientId = match.patientId;
          if (!this.patientName && match.patientName) {
            this.patientName = match.patientName;
          }
          if (!this.patientGender && match.patientGender) {
            this.patientGender = match.patientGender;
          }
          this.loadPatientHistory(match.patientId);
        } else {
          this.isLoadingData = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoadingData = false;
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
          if (Array.isArray(history.activeMedications)) {
            this.activeMedications = history.activeMedications;
          }
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
          const visitDoc = rawData.visitDocument ?? rawData.VisitDocument ?? rawData.visit_document ?? '';

          this.interactionResult = {
            status,
            conflicts,
            visitDocument: visitDoc,
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

  isPdf(filePath?: string): boolean {
    return !!filePath && filePath.toLowerCase().endsWith('.pdf');
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

  copiedDoc: boolean = false;

  copyVisitDocument(): void {
    if (!this.interactionResult?.visitDocument) return;
    navigator.clipboard.writeText(this.interactionResult.visitDocument).then(() => {
      this.copiedDoc = true;
      this.showToast('success', 'Clinical visit document copied to clipboard!');
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copiedDoc = false;
        this.cdr.detectChanges();
      }, 3000);
    }).catch(() => {
      this.showToast('info', 'Document content ready to view/print.');
    });
  }

  renderMarkdown(content?: string): SafeHtml {
    if (!content) return '';

    // 1. Normalize line breaks and Unicode non-breaking spaces
    let raw = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u202F\u00A0]/g, ' ');

    // 2. Extract and protect fenced code blocks
    const codeBlocks: string[] = [];
    raw = raw.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const escapedCode = this.escapeHtml(code.trimEnd());
      const langLabel = lang
        ? `<div class="chat-code-header"><span>${this.escapeHtml(lang)}</span></div>`
        : '';
      const html = `<div class="chat-code-wrapper">${langLabel}<pre class="chat-code-block"><code>${escapedCode}</code></pre></div>`;
      codeBlocks.push(html);
      return `\n§§CODEBLOCK-${codeBlocks.length - 1}§§\n`;
    });

    // 3. Extract and protect inline code
    const inlineCodes: string[] = [];
    raw = raw.replace(/`([^`\n]+)`/g, (_match, code) => {
      const html = `<code class="chat-inline-code">${this.escapeHtml(code)}</code>`;
      inlineCodes.push(html);
      return `§§INLINECODE-${inlineCodes.length - 1}§§`;
    });

    // 4. Parse block by block
    const lines = raw.split('\n');
    const output: string[] = [];

    let inList = false;
    const listStack: Array<{ type: 'ul' | 'ol'; indent: number }> = [];
    let inBlockquote = false;
    let quoteLines: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];
    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      if (paragraphLines.length > 0) {
        const text = paragraphLines.join('<br/>');
        output.push(`<p class="visit-doc-p">${this.formatInline(text)}</p>`);
        paragraphLines = [];
      }
    };

    const flushQuote = () => {
      if (inBlockquote && quoteLines.length > 0) {
        const text = quoteLines.join('<br/>');
        output.push(`<blockquote class="visit-doc-quote">${this.formatInline(text)}</blockquote>`);
        quoteLines = [];
        inBlockquote = false;
      }
    };

    const flushTable = () => {
      if (inTable && tableLines.length > 0) {
        output.push(this.renderTableHtml(tableLines));
        tableLines = [];
        inTable = false;
      }
    };

    const closeAllLists = () => {
      while (listStack.length > 0) {
        const top = listStack.pop()!;
        output.push(`</li></${top.type}>`);
      }
      inList = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for codeblock placeholder
      const codeblockMatch = trimmed.match(/^§§CODEBLOCK-(\d+)§§$/);
      if (codeblockMatch) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        const index = parseInt(codeblockMatch[1], 10);
        output.push(codeBlocks[index]);
        continue;
      }

      // Check for empty line
      if (!trimmed) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        continue;
      }

      // Check for Horizontal Rule: ---, ***, ___
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        output.push('<hr class="visit-doc-hr" />');
        continue;
      }

      // Check for Headings: #, ##, ###, ####
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushQuote();
        flushTable();
        closeAllLists();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        output.push(`<h${level} class="visit-doc-h${level}">${this.formatInline(text)}</h${level}>`);
        continue;
      }

      // Check for Blockquote: > text
      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushTable();
        closeAllLists();
        inBlockquote = true;
        quoteLines.push(quoteMatch[1]);
        continue;
      } else if (inBlockquote) {
        flushQuote();
      }

      // Check for Table: line starts and ends with |
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        flushParagraph();
        flushQuote();
        closeAllLists();
        inTable = true;
        tableLines.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Check for List items:
      // Unordered: [-*+•◦▪] or sub-bullets with spaces
      // Ordered: 1. or 1)
      const listMatch = line.match(/^(\s*)([-*+•◦▪]|\d+[\.\)])\s+(.+)$/);
      if (listMatch) {
        flushParagraph();
        flushQuote();
        flushTable();

        const leadingSpaces = listMatch[1].length;
        const bullet = listMatch[2];
        const itemContent = listMatch[3];
        const isOrdered = /^\d+[\.\)]$/.test(bullet);
        const listType: 'ul' | 'ol' = isOrdered ? 'ol' : 'ul';

        if (listStack.length === 0) {
          listStack.push({ type: listType, indent: leadingSpaces });
          output.push(`<${listType} class="visit-doc-${listType}"><li>${this.formatInline(itemContent)}`);
        } else {
          const currentList = listStack[listStack.length - 1];
          if (leadingSpaces > currentList.indent) {
            listStack.push({ type: listType, indent: leadingSpaces });
            output.push(`<${listType} class="visit-doc-${listType} visit-doc-sublist"><li>${this.formatInline(itemContent)}`);
          } else if (leadingSpaces < currentList.indent) {
            while (listStack.length > 1 && leadingSpaces < listStack[listStack.length - 1].indent) {
              const closed = listStack.pop()!;
              output.push(`</li></${closed.type}>`);
            }
            output.push(`</li><li>${this.formatInline(itemContent)}`);
          } else {
            output.push(`</li><li>${this.formatInline(itemContent)}`);
          }
        }
        inList = true;
        continue;
      }

      // Indented continuation inside list item
      if (inList && line.match(/^\s{2,}\S/)) {
        output.push(` ${this.formatInline(trimmed)}`);
        continue;
      } else if (inList) {
        closeAllLists();
      }

      // Plain paragraph line
      paragraphLines.push(trimmed);
    }

    // Flush any remaining blocks
    flushParagraph();
    flushQuote();
    flushTable();
    closeAllLists();

    let finalHtml = output.join('');

    // 5. Restore inline code placeholders
    finalHtml = finalHtml.replace(/§§INLINECODE-(\d+)§§/g, (_match, index) => {
      return inlineCodes[parseInt(index, 10)] || '';
    });

    return this.sanitizer.bypassSecurityTrustHtml(finalHtml);
  }

  private renderTableHtml(tableLines: string[]): string {
    if (tableLines.length === 0) return '';

    const parseRow = (row: string): string[] => {
      return row
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
    };

    let html = '<div class="visit-doc-table-wrap"><table class="visit-doc-table">';
    let headerParsed = false;

    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      // Check if it is separator row (e.g. |---|---|)
      if (/^\|?(\s*:?-+:?\s*\|?)+$/.test(line)) {
        continue;
      }

      const cells = parseRow(line);
      if (!headerParsed) {
        html += '<thead><tr>';
        cells.forEach((cell) => {
          html += `<th>${this.formatInline(cell)}</th>`;
        });
        html += '</tr></thead><tbody>';
        headerParsed = true;
      } else {
        html += '<tr>';
        cells.forEach((cell) => {
          html += `<td>${this.formatInline(cell)}</td>`;
        });
        html += '</tr>';
      }
    }

    if (headerParsed) {
      html += '</tbody>';
    }
    html += '</table></div>';
    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatInline(text: string): string {
    if (!text) return '';

    // 1. Escape raw HTML special chars first
    let s = this.escapeHtml(text);

    // 2. Links: [text](url)
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="visit-doc-link">$1</a>'
    );

    // 3. Bold + Italic: ***text*** or ___text___
    s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');

    // 4. Bold: **text** or __text__
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 5. Italic: *text* or _text_
    s = s.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // 6. Strikethrough: ~~text~~
    s = s.replace(/~~(.*?)~~/g, '<del>$1</del>');

    return s;
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
