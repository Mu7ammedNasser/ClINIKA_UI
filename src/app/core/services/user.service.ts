import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import { UserDto, CreateUserRequest } from '../interfaces/user.interfaces';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Retrieves all users.
   */
  getUsers(): Observable<ApiResponse<UserDto[]>> {
    return this.http.get<ApiResponse<UserDto[]>>(`${this.apiUrl}/Users`);
  }

  /**
   * Creates a new user.
   */
  createUser(data: CreateUserRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/Users`, data);
  }

  /**
   * Activates a user by ID.
   */
  activateUser(id: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/Users/${id}/activate`, {});
  }

  /**
   * Deactivates a user by ID.
   */
  deactivateUser(id: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/Users/${id}/deactivate`, {});
  }
}
