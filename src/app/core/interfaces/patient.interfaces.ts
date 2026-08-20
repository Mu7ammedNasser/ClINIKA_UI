export interface PatientProfileDto {
  patientId: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  nationalId: string | null;
  completedAt: string | null;
  isProfileCompleted: boolean;
}

export interface MedicationDto {
  drugName: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  sourceSessionId?: number | null;
  prescribedByDoctor?: string | null;
  sourceSessionDate?: string | null;
}

export interface PrescribedMedicationObject {
  drugName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  notes?: string;
  doctorName?: string;
  sessionDate?: string;
}

export interface PatientDiseaseDto {
  diseaseCode: string;
  diseaseName: string;
  diagnosedDate: string;
}

export interface PatientAllergyDto {
  allergenName: string;
  severity: string;
}

export interface PatientSessionDto {
  sessionId: number;
  visitDate: string;
  doctorName: string;
  doctorSpecialty?: string;
  status: string;
  finalDiagnosis: string;
}

export interface SessionAiReportDto {
  id: number;
  patientSummary?: string;
  possibleDiagnoses?: string;
  drugInteractions?: string;
  contraindications?: string;
  suggestedInvestigations?: string;
  clinicalAlerts?: string;
  generatedAt: string;
}

export interface PrescribedMedicationDto {
  id: number;
  drugName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface UploadedDocumentDto {
  id: number;
  documentType: string;
  filePath: string;
  extractedText?: string;
  uploadedAt: string;
}

export interface PatientSessionDetailsDto {
  sessionId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  visitDate: string;
  status: string;
  finalizedAt?: string;
  audioTranscript?: string;
  extractedSymptoms?: string;
  mentionedMedications?: string;
  mentionedHistory?: string;
  finalDiagnosis?: string;
  doctorNotes?: string;
  followUpRecommendations?: string;
  aiReport?: SessionAiReportDto | null;
  prescribedMedications: PrescribedMedicationDto[];
  uploadedDocuments: UploadedDocumentDto[];
}

export interface PatientMedicalDataDto {
  patientId: number;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  activeMedications: MedicationDto[];
  prescribedMedications: PrescribedMedicationObject[];
  diseases: PatientDiseaseDto[];
  allergies: PatientAllergyDto[];
  sessions: PatientSessionDto[];
}

export interface UpdateMedicalInfoRequest {
  gender: string;
  bloodType: string;
  nationalId: string;
  dateOfBirth: string;
  medications: {
    drugName: string;
    dosage: string;
    frequency: string;
  }[];
  diseases: {
    diseaseId: number | null;
    rawDiseaseName: string | null;
    diagnosedDate: string;
  }[];
  allergies: {
    allergyId: number | null;
    rawAllergenName: string | null;
    severity: string;
  }[];
}

export interface PatientSearchDto {
  id: number;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  nationalId: string | null;
}

export interface PatientHistoryDto {
  patientId: number;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  diseases: PatientDiseaseDto[];
  allergies: PatientAllergyDto[];
  activeMedications: MedicationDto[];
}
