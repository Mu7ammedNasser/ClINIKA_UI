export interface CreateSessionRequest {
  patientId: number;
}

export interface DiagnosisResultEvent {
  sessionId: number;
  status: string;
}

export interface PrescribeMedicationRequest {
  drugName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface PrescribedMedicationDto {
  id: number;
  drugName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}