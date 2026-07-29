import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { 
  PatientProfileDto, 
  PatientMedicalDataDto, 
  UpdateMedicalInfoRequest 
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

  getMedicalData(): Observable<ApiResponse<PatientMedicalDataDto>> {
    return this.http.get<ApiResponse<PatientMedicalDataDto>>(`${this.apiUrl}/Patient/medical-data`);
  }

  updateMedicalInfo(data: UpdateMedicalInfoRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Patient/medical-info`, data);
  }
}
