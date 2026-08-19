import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import {
  CreateSessionRequest,
  PrescribeMedicationRequest,
  PrescribedMedicationDto,
  DoctorSessionReportDto,
  SessionDiagnosisResultDto,
} from '../interfaces/session.interfaces';

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
   * Prescribes one or more medications for a session.
   * Accepts an array of medications to be saved in the PrescribedMedications table.
   */
  prescribeMedications(
    sessionId: number,
    medications: PrescribeMedicationRequest[]
  ): Observable<ApiResponse<PrescribedMedicationDto[]>> {
    return this.http.post<ApiResponse<PrescribedMedicationDto[]>>(
      `${this.apiUrl}/Sessions/${sessionId}/prescribe`,
      medications
    );
  }

  /**
   * Retrieves already prescribed medications for a session.
   */
  getPrescribedMedications(sessionId: number): Observable<ApiResponse<PrescribedMedicationDto[]>> {
    return this.http.get<ApiResponse<PrescribedMedicationDto[]>>(
      `${this.apiUrl}/Sessions/${sessionId}/prescribe`
    );
  }

  /**
   * Retrieves all session reports for the logged-in doctor, with optional search.
   */
  getDoctorReports(search?: string): Observable<ApiResponse<DoctorSessionReportDto[]>> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<ApiResponse<DoctorSessionReportDto[]>>(
      `${this.apiUrl}/Sessions/doctor-reports`,
      { params }
    );
  }

  /**
   * Retrieves the full diagnosis and clinical summary for a specific session.
   */
  getSessionDiagnosis(sessionId: number): Observable<ApiResponse<SessionDiagnosisResultDto>> {
    return this.http.get<ApiResponse<SessionDiagnosisResultDto>>(
      `${this.apiUrl}/Sessions/${sessionId}/diagnosis`
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


