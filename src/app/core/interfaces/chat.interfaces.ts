// ─── Chat Interfaces ─────────────────────────────────────────────
// Maps to backend DTOs in CliniKa.Application.DTOs.Chat

export interface SendMessageRequest {
  patientId: number;
  chatSessionId: number | null;
  message: string;
}

export interface SendMessageResponse {
  chatSessionId: number;
  reply: string;
  timestamp: string;
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface ChatSessionSummary {
  chatSessionId: number;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}
