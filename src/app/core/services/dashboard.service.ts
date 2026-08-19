import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { DashboardSummaryData } from '../interfaces/dashboard.interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Retrieves dashboard summary metrics (totalUsers, totalAiSessions, topDiseases).
   */
  getDashboardSummary(): Observable<ApiResponse<DashboardSummaryData>> {
    return this.http.get<ApiResponse<DashboardSummaryData>>(`${this.apiUrl}/Dashboard/summary`);
  }
}
