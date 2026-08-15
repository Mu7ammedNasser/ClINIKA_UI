import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { ApiResponse } from '../interfaces/auth.interfaces';
import {
  SendMessageRequest,
  SendMessageResponse,
  ChatMessage,
  ChatSessionSummary,
} from '../interfaces/chat.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetches all chat sessions for a patient (sidebar list).
   * Ordered by most recent message first.
   */
  getPatientChats(patientId: number): Observable<ApiResponse<ChatSessionSummary[]>> {
    return this.http.get<ApiResponse<ChatSessionSummary[]>>(
      `${this.apiUrl}/Chat/patient/${patientId}`
    );
  }

  /**
   * Fetches the full message history for a specific chat session.
   * Called when the patient clicks on a previous conversation in the sidebar.
   */
  getChatHistory(chatSessionId: number): Observable<ApiResponse<ChatMessage[]>> {
    return this.http.get<ApiResponse<ChatMessage[]>>(
      `${this.apiUrl}/Chat/${chatSessionId}/history`
    );
  }

  /**
   * Sends a message and returns the AI response.
   * If chatSessionId is null or 0, the backend creates a new chat session.
   */
  sendMessage(request: SendMessageRequest): Observable<ApiResponse<SendMessageResponse>> {
    return this.http.post<ApiResponse<SendMessageResponse>>(
      `${this.apiUrl}/Chat/send`,
      request
    );
  }
}
