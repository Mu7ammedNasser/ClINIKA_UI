export interface CreateSessionRequest {
  patientId: number;
}

export interface DiagnosisResultEvent {
  sessionId: number;
  status: string;
}