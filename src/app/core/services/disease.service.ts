import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { DiseaseDto, CreateDiseaseRequest } from '../interfaces/disease.interfaces';

@Injectable({ providedIn: 'root' })
export class DiseaseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getDiseases(search?: string): Observable<ApiResponse<DiseaseDto[]>> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse<DiseaseDto[]>>(`${this.apiUrl}/Diseases`, { params });
  }

  getDiseaseById(id: number): Observable<ApiResponse<DiseaseDto>> {
    return this.http.get<ApiResponse<DiseaseDto>>(`${this.apiUrl}/Diseases/${id}`);
  }

  createDisease(data: CreateDiseaseRequest): Observable<ApiResponse<DiseaseDto>> {
    return this.http.post<ApiResponse<DiseaseDto>>(`${this.apiUrl}/Diseases`, data);
  }

  updateDisease(id: number, data: CreateDiseaseRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/Diseases/${id}`, data);
  }

  deleteDisease(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Diseases/${id}`);
  }
}
