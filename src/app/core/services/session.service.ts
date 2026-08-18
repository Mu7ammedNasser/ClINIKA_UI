import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { CreateSessionRequest } from '../interfaces/session.interfaces';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Creates a new clinical session for a patient.
   * Returns the created session ID.
   */
  createSession(data: CreateSessionRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/Sessions`, data);
  }

  /**
   * Sends audio and optional document files for AI diagnosis.
   * Uses multipart/form-data.
   */
  diagnoseSession(sessionId: number, audio: File, documents?: File[]): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('audio', audio, audio.name);

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        formData.append('documents', doc, doc.name);
      }
    }

    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/Sessions/${sessionId}/diagnose`,
      formData
    );
  }

  /**
   * Connects to the SSE stream to wait for diagnosis completion.
   * Returns an EventSource that emits 'diagnosis-complete' events.
   */
  connectDiagnosisStream(sessionId: number): EventSource {
    return new EventSource(`${this.apiUrl}/Sessions/${sessionId}/diagnosis-stream`);
  }
}
