import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { 
  PatientProfileDto, 
  PatientPersonalInfoDto,
  PatientMedicalDataDto, 
  UpdateMedicalInfoRequest,
  PatientSearchDto,
  PatientHistoryDto,
  PatientSessionDto,
  PatientSessionDetailsDto
} from '../interfaces/patient.interfaces';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProfile(): Observable<ApiResponse<PatientProfileDto>> {
    return this.http.get<ApiResponse<PatientProfileDto>>(`${this.apiUrl}/Patient/profile`);
  }

  updatePersonalInfo(data: { firstName: string; lastName: string; phoneNumber: string }): Observable<ApiResponse<PatientPersonalInfoDto>> {
    return this.http.put<ApiResponse<PatientPersonalInfoDto>>(`${this.apiUrl}/Patient/personal-info`, data);
  }

  getMedicalData(): Observable<ApiResponse<PatientMedicalDataDto>> {
    return this.http.get<ApiResponse<PatientMedicalDataDto>>(`${this.apiUrl}/Patient/medical-data`);
  }

  getSessions(): Observable<ApiResponse<PatientSessionDto[]>> {
    return this.http.get<ApiResponse<PatientSessionDto[]>>(`${this.apiUrl}/Patient/sessions`);
  }

  getSessionDetails(sessionId: number): Observable<ApiResponse<PatientSessionDetailsDto>> {
    return this.http.get<ApiResponse<PatientSessionDetailsDto>>(`${this.apiUrl}/Patient/sessions/${sessionId}`);
  }

  updateMedicalInfo(data: UpdateMedicalInfoRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/Patient/medical-info`, data);
  }

  searchPatient(query: string): Observable<ApiResponse<PatientSearchDto>> {
    // Note: User mentioned "take name or national id in query".
    // Checking standard query string for such scenarios, assume ?searchTerm= or ?query=
    return this.http.get<ApiResponse<PatientSearchDto>>(`${this.apiUrl}/Patient/search?query=${encodeURIComponent(query)}`);
  }

  getPatientHistory(id: number): Observable<ApiResponse<PatientHistoryDto>> {
    return this.http.get<ApiResponse<PatientHistoryDto>>(`${this.apiUrl}/Patient/history/${id}`);
  }
}
