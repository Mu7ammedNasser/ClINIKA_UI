import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import {
  PatientSessionDto,
  PatientSessionDetailsDto,
} from '../../../core/interfaces/patient.interfaces';

@Component({
  selector: 'app-patient-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-sessions.html',
  styleUrl: './patient-sessions.css',
})
export class PatientSessions implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);

  // Main state
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly sessions = signal<PatientSessionDto[]>([]);
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('all');

  // Modal state
  readonly isModalOpen = signal(false);
  readonly isLoadingDetails = signal(false);
  readonly detailsError = signal<string | null>(null);
  readonly selectedSessionDetails = signal<PatientSessionDetailsDto | null>(null);

  readonly isCompletedStatus = (status?: string | null): boolean => {
    if (!status) return false;
    const clean = status.toLowerCase().replace(/[\s_-]/g, '');
    return clean === 'completed' || clean === 'finalized' || clean === 'done';
  };

  readonly isActiveStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return !this.isCompletedStatus(status);
  };

  readonly completedCount = computed(() => {
    return this.sessions().filter((s) => this.isCompletedStatus(s.status)).length;
  });

  readonly activeCount = computed(() => {
    return this.sessions().filter((s) => this.isActiveStatus(s.status)).length;
  });

  readonly filteredSessions = computed(() => {
    const list = this.sessions();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((s) => {
      // 1. Check Search Query (Client-Side)
      const visitDateStr = s.visitDate ? new Date(s.visitDate).toLocaleDateString() : '';
      const visitDateFull = s.visitDate ? new Date(s.visitDate).toDateString().toLowerCase() : '';
      
      const matchesQuery =
        !query ||
        (s.doctorName && s.doctorName.toLowerCase().includes(query)) ||
        (s.finalDiagnosis && s.finalDiagnosis.toLowerCase().includes(query)) ||
        (s.status && s.status.toLowerCase().includes(query)) ||
        (s.doctorSpecialty && s.doctorSpecialty.toLowerCase().includes(query)) ||
        (s.sessionId && s.sessionId.toString().includes(query)) ||
        visitDateStr.includes(query) ||
        visitDateFull.includes(query);

      // 2. Check Status Filter
      let matchesStatus = true;
      if (status === 'completed') {
        matchesStatus = this.isCompletedStatus(s.status);
      } else if (status === 'active') {
        matchesStatus = this.isActiveStatus(s.status);
      }

      return matchesQuery && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Call getSessions() or fallback to getMedicalData()
    this.patientService.getSessions().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.sessions.set(res.data);
          this.isLoading.set(false);
        } else {
          // Fallback to getMedicalData if needed
          this.loadFromMedicalData();
        }
      },
      error: () => {
        this.loadFromMedicalData();
      },
    });
  }

  private loadFromMedicalData(): void {
    this.patientService.getMedicalData().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data?.sessions) {
          this.sessions.set(res.data.sessions);
        } else {
          this.errorMessage.set(res.message || 'Unable to load clinical sessions.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load patient sessions', err);
        this.errorMessage.set('Failed to connect to the server. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

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

  navigateToDashboard(): void {
    this.router.navigate(['/patient/dashboard']);
  }
}
