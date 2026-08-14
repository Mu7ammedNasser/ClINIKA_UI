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
  doctorSpecialty: string;
  status: string;
  finalDiagnosis: string;
}

export interface PatientMedicalDataDto {
  patientId: number;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  activeMedications: MedicationDto[];
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
