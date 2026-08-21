export interface CreateDoctorInitialRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  confirmPassword?: string;
}

export interface DoctorEmailConfirmationDto {
  requestId: number;
  token: string;
}

export interface CompleteDoctorProfileDto {
  // Personal Info
  fullNameArabic: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  nationalIdOrPassportNumber: string;
  country: string;
  city: string;
  address: string;
  personalPhoto?: File | null;
  personalPhotoUrl?: string;

  // Medical Info
  medicalProfession: string;
  primarySpecialty: string;
  subSpecialty?: string;
  yearsOfExperience: number;
  medicalLicenseNumber: string;
  licenseIssuingAuthority: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  professionalRegistrationNumber: string;
  professionalRegistrationStatus: string;

  // Education
  medicalSchoolOrUniversity: string;
  medicalDegree: string;
  graduationYear: number;
  internshipStartDate: string;
  internshipEndDate: string;
  postgraduateQualification?: string;
  qualificationName?: string;
  institution?: string;
  yearObtained?: number;

  // Documents (Files or existing URLs)
  specialtyCertificationDocument?: File | null;
  specialtyCertificationDocumentUrl?: string;
  medicalDegreeCertificateDocument?: File | null;
  medicalDegreeCertificateDocumentUrl?: string;
  internshipCertificateDocument?: File | null;
  internshipCertificateDocumentUrl?: string;
  nationalIdDocument?: File | null;
  nationalIdDocumentUrl?: string;
  medicalLicenseDocument?: File | null;
  medicalLicenseDocumentUrl?: string;
  professionalRegistrationDocument?: File | null;
  professionalRegistrationDocumentUrl?: string;
  mastersDegreeCertificateDocument?: File | null;
  phdCertificateDocument?: File | null;
  fellowshipCertificateDocument?: File | null;
  boardCertificateDocument?: File | null;
  additionalTrainingCertificatesDocument?: File | null;

  // Declarations
  informationAccuracyConfirmed: boolean;
  termsAndConditionsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  selectedPlan: string;
}

export interface DoctorRegistrationRequestSummaryDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: string;
  primarySpecialty?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  isEmailConfirmed: boolean;
  createdAt: string;
}

export interface DoctorRegistrationRequestDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  fullNameArabic?: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  nationalIdOrPassportNumber?: string;
  personalPhotoUrl?: string;
  country?: string;
  city?: string;
  address?: string;

  medicalProfession?: string;
  primarySpecialty?: string;
  subSpecialty?: string;
  yearsOfExperience?: number;
  medicalLicenseNumber?: string;
  licenseIssuingAuthority?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  professionalRegistrationNumber?: string;
  professionalRegistrationStatus?: string;

  medicalSchoolOrUniversity?: string;
  medicalDegree?: string;
  graduationYear?: number;
  internshipStartDate?: string;
  internshipEndDate?: string;
  postgraduateQualification?: string;
  qualificationName?: string;
  institution?: string;
  yearObtained?: number;

  specialtyCertificationDocumentUrl?: string;
  medicalDegreeCertificateDocumentUrl?: string;
  internshipCertificateDocumentUrl?: string;
  nationalIdDocumentUrl?: string;
  medicalLicenseDocumentUrl?: string;
  professionalRegistrationDocumentUrl?: string;
  mastersDegreeCertificateDocumentUrl?: string;
  phdCertificateDocumentUrl?: string;
  fellowshipCertificateDocumentUrl?: string;
  boardCertificateDocumentUrl?: string;
  additionalTrainingCertificatesDocumentUrl?: string;

  informationAccuracyConfirmed: boolean;
  termsAndConditionsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  selectedPlan?: string;

  status: string;
  isEmailConfirmed: boolean;
  emailConfirmedAt?: string;
  rejectionReason?: string;
  reviewedByAdminUserId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface RejectDoctorRequestDto {
  reason: string;
}
