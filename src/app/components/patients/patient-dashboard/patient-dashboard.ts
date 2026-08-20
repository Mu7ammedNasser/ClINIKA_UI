import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import {
  PatientMedicalDataDto,
  MedicationDto,
  PrescribedMedicationObject,
  PatientDiseaseDto,
  PatientAllergyDto,
  PatientSessionDto,
  PatientSessionDetailsDto,
} from '../../../core/interfaces/patient.interfaces';

type MedicationTab = 'active' | 'prescribed';
type SectionTab = 'medications' | 'conditions' | 'sessions';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);

  // Main state
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly medicalData = signal<PatientMedicalDataDto | null>(null);

  // Filtering and active tabs
  readonly activeSection = signal<SectionTab>('medications');
  readonly medTab = signal<MedicationTab>('active');
  readonly medSearchQuery = signal<string>('');

  // Session details modal state
  readonly isModalOpen = signal(false);
  readonly isLoadingDetails = signal(false);
  readonly detailsError = signal<string | null>(null);
  readonly selectedSessionDetails = signal<PatientSessionDetailsDto | null>(null);

  // Computed properties
  readonly patientAge = computed(() => {
    const data = this.medicalData();
    if (!data?.dateOfBirth) return null;
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  });

  readonly recentSessions = computed(() => {
    const data = this.medicalData();
    if (!data?.sessions) return [];
    return data.sessions.slice(0, 3);
  });

  readonly filteredActiveMedications = computed(() => {
    const data = this.medicalData();
    if (!data?.activeMedications) return [];
    const query = this.medSearchQuery().toLowerCase().trim();
    if (!query) return data.activeMedications;
    return data.activeMedications.filter(
      (m) =>
        m.drugName.toLowerCase().includes(query) ||
        m.dosage.toLowerCase().includes(query) ||
        m.frequency.toLowerCase().includes(query)
    );
  });

  readonly filteredPrescribedMedications = computed(() => {
    const data = this.medicalData();
    if (!data?.prescribedMedications) return [];
    const query = this.medSearchQuery().toLowerCase().trim();
    if (!query) return data.prescribedMedications;
    return data.prescribedMedications.filter(
      (m) =>
        m.drugName.toLowerCase().includes(query) ||
        m.dosage?.toLowerCase().includes(query) ||
        m.doctorName?.toLowerCase().includes(query) ||
        m.frequency?.toLowerCase().includes(query)
    );
  });

  navigateToSessions(): void {
    this.router.navigate(['/patient/sessions']);
  }

  ngOnInit(): void {
    this.loadMedicalData();
  }

  loadMedicalData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.patientService.getMedicalData().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.medicalData.set(res.data);
        } else {
          this.errorMessage.set(res.message || 'Unable to retrieve medical records.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching patient medical data', err);
        this.errorMessage.set('Failed to connect to server. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  setSection(section: SectionTab): void {
    this.activeSection.set(section);
  }

  setMedTab(tab: MedicationTab): void {
    this.medTab.set(tab);
  }

  isLifelongMedication(endDate?: string | null): boolean {
    if (!endDate) return true;
    const trimmed = endDate.trim();
    return trimmed === '' || trimmed === 'null' || trimmed === 'undefined';
  }

  getSeverityClass(severity: string | null | undefined): string {
    const s = (severity || '').toLowerCase();
    if (s.includes('severe') || s.includes('high') || s.includes('critical')) {
      return 'severity-severe';
    }
    if (s.includes('moderate') || s.includes('medium')) {
      return 'severity-moderate';
    }
    return 'severity-mild';
  }

  navigateToProfile(): void {
    this.router.navigate(['/patient/profile']);
  }

  // Session Details Modal
  openSessionDetails(sessionId: number): void {
    this.isModalOpen.set(true);
    this.isLoadingDetails.set(true);
    this.detailsError.set(null);
    this.selectedSessionDetails.set(null);

    this.patientService.getSessionDetails(sessionId).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.selectedSessionDetails.set(res.data);
        } else {
          this.detailsError.set(res.message || 'Could not load session details.');
        }
        this.isLoadingDetails.set(false);
      },
      error: (err) => {
        console.error('Error fetching session details', err);
        this.detailsError.set('Failed to load session details. Please try again.');
        this.isLoadingDetails.set(false);
      },
    });
  }

  closeSessionDetails(): void {
    this.isModalOpen.set(false);
    this.selectedSessionDetails.set(null);
    this.detailsError.set(null);
  }
}
