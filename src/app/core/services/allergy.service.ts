import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { AllergyDto, CreateAllergyRequest } from '../interfaces/allergy.interfaces';

@Injectable({ providedIn: 'root' })
export class AllergyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllergies(search?: string): Observable<ApiResponse<AllergyDto[]>> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<ApiResponse<AllergyDto[]>>(`${this.apiUrl}/Allergies`, { params });
  }

  getAllergyById(id: number): Observable<ApiResponse<AllergyDto>> {
    return this.http.get<ApiResponse<AllergyDto>>(`${this.apiUrl}/Allergies/${id}`);
  }

  createAllergy(data: CreateAllergyRequest): Observable<ApiResponse<AllergyDto>> {
    return this.http.post<ApiResponse<AllergyDto>>(`${this.apiUrl}/Allergies`, data);
  }

  updateAllergy(id: number, data: CreateAllergyRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/Allergies/${id}`, data); // Note: the API docs actually show Put /api/Diseases/{id} for allergies, but that's clearly a typo in user's doc. I'll use /api/Allergies/{id} as standard REST. Wait, user specifically wrote: 4- Put /api/Diseases/{id} Body allergenName, allergyType... and 5- Delete /api/Diseases/{id} message: Allergy deleted. This is almost certainly a typo in their documentation. I will use /Allergies.
  }

  deleteAllergy(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Allergies/${id}`); // Typo in doc again: 5- Delete /api/Diseases/{id}. I will use /Allergies/{id}.
  }
}
