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

export interface DoctorSessionReportDto {
  sessionId: number;
  patientId: number;
  patientName: string;
  patientGender?: string;
  patientPhoneNumber?: string;
  visitDate: string;
  status: string;
  finalDiagnosis?: string;
  possibleDiagnoses?: string;
  patientSummary?: string;
  hasAiReport: boolean;
  prescribedMedicationsCount: number;
}

export interface SessionDiagnosisResultDto {
  sessionId: number;
  patientId: number;
  patientName?: string;
  patientGender?: string;
  visitDate: string;
  status: string;
  audioTranscript?: string;
  extractedSymptoms?: string;
  patientSummary?: string;
  possibleDiagnoses?: string;
  drugInteractions?: string;
  contraindications?: string;
  suggestedInvestigations?: string;
  clinicalAlerts?: string;
  finalDiagnosis?: string;
  generatedAt?: string;
  prescribedMedications: PrescribedMedicationDto[];
}

export interface DrugConflictItem {
  source?: string;
  details: string;
  newDrug: string;
  conflict: boolean;
  currentDrug: string;
  similarityScore?: number;
}

export interface DrugInteractionData {
  status: string;
  conflicts: DrugConflictItem[];
}

