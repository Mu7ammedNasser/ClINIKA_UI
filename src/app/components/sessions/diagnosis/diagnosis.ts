import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

export interface DocumentPreview {
  file: File;
  previewUrl: string | null;
  isImage: boolean;
  isPdf: boolean;
}

@Component({
  selector: 'app-diagnosis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnosis.html',
  styleUrl: './diagnosis.css',
})
export class Diagnosis implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Session info
  sessionId: number | null = null;
  patientName: string = '';

  // Mode: 'upload' | 'record'
  audioInputMode: 'upload' | 'record' = 'upload';

  // File state
  audioFile: File | null = null;
  audioPreviewUrl: string | null = null;
  audioPreviewName = '';
  documentPreviews: DocumentPreview[] = [];

  // Drag-over states
  isAudioDragOver = false;
  isDocsDragOver = false;

  // Audio Recording State
  isRecording = false;
  recordingSeconds = 0;
  private recordingTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Submission state
  isSubmitting = false;
  submitError = '';

  // Diagnosis result state
  isDiagnosing = false;
  diagnosisComplete = false;
  diagnosisError = '';

  // SSE
  private eventSource: EventSource | null = null;

  // Toast
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.sessionId = params['sessionId'] ? +params['sessionId'] : null;
      this.patientName = params['patientName'] || '';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.closeEventSource();
    this.stopRecording();
    this.revokeUrls();
  }

  setAudioInputMode(mode: 'upload' | 'record'): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.audioInputMode = mode;
    this.cdr.detectChanges();
  }

  // ─── Live Microphone Recording ──────────────────────────────

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const fileName = `consultation_recording_${Date.now()}.${extension}`;
        
        this.audioFile = new File([audioBlob], fileName, { type: mimeType });
        this.audioPreviewName = fileName;
        if (this.audioPreviewUrl) {
          URL.revokeObjectURL(this.audioPreviewUrl);
        }
        this.audioPreviewUrl = URL.createObjectURL(audioBlob);
        this.cdr.detectChanges();

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.recordingTimer = setInterval(() => {
        this.recordingSeconds++;
        this.cdr.detectChanges();
      }, 1000);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Microphone access error:', err);
      this.showToast('error', 'Microphone permission denied or device not found.');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    this.isRecording = false;
    this.cdr.detectChanges();
  }

  formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ─── File Selection & Drag-and-Drop ─────────────────────────

  onAudioSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setAudioFile(input.files[0]);
    }
  }

  onAudioDrop(event: DragEvent): void {
    event.preventDefault();
    this.isAudioDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|aac|ogg|webm)$/i)) {
        this.setAudioFile(file);
      } else {
        this.showToast('error', 'Please drop a valid audio file (MP3, WAV, M4A, WEBM, OGG).');
      }
    }
  }

  private setAudioFile(file: File): void {
    this.audioFile = file;
    this.audioPreviewName = file.name;
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
    }
    this.audioPreviewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  removeAudio(): void {
    this.audioFile = null;
    this.audioPreviewName = '';
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
      this.audioPreviewUrl = null;
    }
    this.cdr.detectChanges();
  }

  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addDocuments(Array.from(input.files));
    }
  }

  onDocsDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDocsDragOver = false;
    if (event.dataTransfer?.files) {
      this.addDocuments(Array.from(event.dataTransfer.files));
    }
  }

  private addDocuments(files: File[]): void {
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;

      this.documentPreviews.push({
        file,
        previewUrl,
        isImage,
        isPdf,
      });
    }
    this.cdr.detectChanges();
  }

  removeDocument(index: number): void {
    const item = this.documentPreviews[index];
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.documentPreviews.splice(index, 1);
    this.cdr.detectChanges();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private revokeUrls(): void {
    if (this.audioPreviewUrl) {
      URL.revokeObjectURL(this.audioPreviewUrl);
      this.audioPreviewUrl = null;
    }
    for (const doc of this.documentPreviews) {
      if (doc.previewUrl) {
        URL.revokeObjectURL(doc.previewUrl);
      }
    }
  }

  // ─── Submit & SSE ───────────────────────────────────────────

  submitDiagnosis(): void {
    if (!this.sessionId || !this.audioFile) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.cdr.detectChanges();

    const documents = this.documentPreviews.map((d) => d.file);

    this.sessionService
      .diagnoseSession(this.sessionId, this.audioFile, documents.length > 0 ? documents : undefined)
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.isSubmitting = false;
            this.isDiagnosing = true;
            this.showToast('info', 'Files uploaded! Live AI diagnosis in progress...');
            this.connectToSSE();
          } else {
            this.submitError = res.message || 'Failed to submit diagnosis.';
            this.showToast('error', this.submitError);
            this.isSubmitting = false;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Diagnosis submission failed:', err);
          let errorMsg = 'Failed to submit diagnosis. Please try again.';
          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.error?.detail) {
            errorMsg = err.error.detail;
          } else if (typeof err.error === 'string') {
            errorMsg = err.error;
          }
          this.submitError = errorMsg;
          this.showToast('error', errorMsg);
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
      });
  }

  private connectToSSE(): void {
    if (!this.sessionId) return;

    this.eventSource = this.sessionService.connectDiagnosisStream(this.sessionId);

    this.eventSource.addEventListener('connected', () => {
      console.log('[SSE] Connected to diagnosis stream for session:', this.sessionId);
    });

    this.eventSource.addEventListener('diagnosis-complete', (event) => {
      console.log('[SSE] Diagnosis complete event received:', event);
      this.isDiagnosing = false;
      this.diagnosisComplete = true;
      this.showToast('success', 'AI clinical diagnosis completed successfully!');
      this.closeEventSource();
      this.cdr.detectChanges();
    });

    this.eventSource.onerror = (error) => {
      console.log('[SSE] Stream closed or ended:', error);
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        if (!this.diagnosisComplete) {
          this.isDiagnosing = false;
          this.diagnosisComplete = true;
          this.showToast('success', 'Diagnosis processing finished!');
          this.cdr.detectChanges();
        }
      }
      this.closeEventSource();
    };
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  goToReports(): void {
    this.router.navigate(['/doctor/sessions/reports']);
  }

  goToInteractionCheck(): void {
    this.router.navigate(['/doctor/sessions/interaction'], {
      queryParams: { sessionId: this.sessionId },
    });
  }

  startNewSession(): void {
    this.router.navigate(['/doctor/sessions/create']);
  }

  showToast(type: 'success' | 'error' | 'info', text: string): void {
    this.toastMessage = { type, text };
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 5000);
  }
}
