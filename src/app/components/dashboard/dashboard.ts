import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { DiseaseService } from '../../core/services/disease.service';
import { AllergyService } from '../../core/services/allergy.service';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { UserRole } from '../../core/interfaces/auth.interfaces';
import { DoctorSessionReportDto } from '../../core/interfaces/session.interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly diseaseService = inject(DiseaseService);
  private readonly allergyService = inject(AllergyService);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);

  readonly role = signal<UserRole | null>(null);
  readonly userName = signal<string>('');
  readonly userEmail = signal<string>('');
  readonly todayDate = signal<string>('');
  readonly isLoading = signal(true);

  // Admin Signals
  readonly totalUsers = signal<number>(0);
  readonly activeUsers = signal<number>(0);
  readonly totalRoles = signal<number>(0);
  readonly totalDiseases = signal<number>(0);
  readonly totalAllergies = signal<number>(0);

  // Doctor Signals
  readonly doctorTotalSessions = signal<number>(0);
  readonly doctorTotalPatients = signal<number>(0);
  readonly doctorAiDiagnoses = signal<number>(0);
  readonly doctorError = signal<string>('');

  ngOnInit(): void {
    const currentRole = this.authService.getUserRole();
    this.role.set(currentRole);

    const user = this.authService.getUser();
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      this.userName.set(fullName || user.email || 'Doctor');
      this.userEmail.set(user.email || '');
    }

    const now = new Date();
    this.todayDate.set(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    );

    if (currentRole === UserRole.Admin) {
      this.loadAdminData();
    } else if (currentRole === UserRole.Doctor) {
      this.loadDoctorData();
    } else {
      this.isLoading.set(false);
    }
  }

  loadDoctorData(): void {
    this.isLoading.set(true);
    this.doctorError.set('');

    this.sessionService.getDoctorReports().subscribe({
      next: (res: any) => {
        const rawData = res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
        const reports: DoctorSessionReportDto[] = Array.isArray(rawData) ? rawData : [];

        this.doctorTotalSessions.set(reports.length);

        // Calculate unique patients count
        const uniquePatients = new Set(
          reports.map((r) => r.patientId).filter((id) => id !== undefined && id !== null)
        );
        this.doctorTotalPatients.set(uniquePatients.size);

        // AI assisted reports
        const aiCount = reports.filter(
          (r) => r.hasAiReport || !!r.possibleDiagnoses || !!r.finalDiagnosis
        ).length;
        this.doctorAiDiagnoses.set(aiCount);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load doctor dashboard data', err);
        this.doctorError.set('Unable to load clinical sessions data.');
        this.isLoading.set(false);
      },
    });
  }

  private loadAdminData(): void {
    this.isLoading.set(true);

    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles(),
      diseases: this.diseaseService.getDiseases(),
      allergies: this.allergyService.getAllergies(),
    }).subscribe({
      next: (res) => {
        if (res.users.isSuccess && res.users.data) {
          this.totalUsers.set(res.users.data.length);
          this.activeUsers.set(res.users.data.filter((u) => u.isActive).length);
        }
        if (res.roles.isSuccess && res.roles.data) {
          this.totalRoles.set(res.roles.data.length);
        }
        if (res.diseases.isSuccess && res.diseases.data) {
          this.totalDiseases.set(res.diseases.data.length);
        }
        if (res.allergies.isSuccess && res.allergies.data) {
          this.totalAllergies.set(res.allergies.data.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin metrics', err);
        this.isLoading.set(false);
      },
    });
  }
}
