import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import {
  CreateDoctorInitialRequestDto,
  DoctorEmailConfirmationDto,
  DoctorRegistrationRequestDto,
  DoctorRegistrationRequestSummaryDto,
  RejectDoctorRequestDto,
} from '../interfaces/doctor-request.interfaces';

@Injectable({
  providedIn: 'root',
})
export class DoctorRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/DoctorRequests`;

  /**
   * Stage 1: Submit initial doctor registration application.
   */
  submitInitialRequest(
    data: CreateDoctorInitialRequestDto
  ): Observable<ApiResponse<DoctorRegistrationRequestDto>> {
    return this.http.post<ApiResponse<DoctorRegistrationRequestDto>>(
      this.apiUrl,
      data
    );
  }

  /**
   * Stage 2: Confirm doctor email via token.
   */
  confirmEmail(dto: DoctorEmailConfirmationDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/confirm-email`,
      dto
    );
  }

  /**
   * Stage 3: Complete full doctor profile and credentials with document attachments.
   */
  completeProfile(
    id: number,
    formData: FormData
  ): Observable<ApiResponse<DoctorRegistrationRequestDto>> {
    return this.http.put<ApiResponse<DoctorRegistrationRequestDto>>(
      `${this.apiUrl}/${id}/complete-profile`,
      formData
    );
  }

  /**
   * Admin: Get all doctor registration requests, with optional status filter.
   */
  getAllRequests(
    status?: string
  ): Observable<ApiResponse<DoctorRegistrationRequestSummaryDto[]>> {
    let params = new HttpParams();
    if (status && status !== 'All') {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<DoctorRegistrationRequestSummaryDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Admin: Get single doctor registration request by ID with all details and document URLs.
   */
  getRequestById(
    id: number
  ): Observable<ApiResponse<DoctorRegistrationRequestDto>> {
    return this.http.get<ApiResponse<DoctorRegistrationRequestDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Admin: Activate doctor account (creates identity account and doctor entity).
   */
  activateDoctor(id: number): Observable<ApiResponse<DoctorRegistrationRequestDto>> {
    return this.http.put<ApiResponse<DoctorRegistrationRequestDto>>(
      `${this.apiUrl}/${id}/activate`,
      {}
    );
  }

  /**
   * Admin: Reject doctor registration request with explanation reason.
   */
  rejectDoctor(
    id: number,
    reason: string
  ): Observable<ApiResponse<DoctorRegistrationRequestDto>> {
    const body: RejectDoctorRequestDto = { reason };
    return this.http.put<ApiResponse<DoctorRegistrationRequestDto>>(
      `${this.apiUrl}/${id}/reject`,
      body
    );
  }
}
