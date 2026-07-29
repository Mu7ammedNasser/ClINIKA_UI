import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { DiseaseService } from '../../core/services/disease.service';
import { AllergyService } from '../../core/services/allergy.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/interfaces/auth.interfaces';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly diseaseService = inject(DiseaseService);
  private readonly allergyService = inject(AllergyService);
  private readonly authService = inject(AuthService);

  readonly role = signal<UserRole | null>(null);

  readonly totalUsers = signal<number>(0);
  readonly activeUsers = signal<number>(0);
  readonly totalRoles = signal<number>(0);
  readonly totalDiseases = signal<number>(0);
  readonly totalAllergies = signal<number>(0);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    const currentRole = this.authService.getUserRole();
    this.role.set(currentRole);

    if (currentRole === UserRole.Admin) {
      this.loadAdminData();
    } else {
      this.isLoading.set(false);
    }
  }

  private loadAdminData() {
    this.isLoading.set(true);
    
    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles(),
      diseases: this.diseaseService.getDiseases(),
      allergies: this.allergyService.getAllergies()
    }).subscribe({
      next: (res) => {
        if (res.users.isSuccess && res.users.data) {
          this.totalUsers.set(res.users.data.length);
          this.activeUsers.set(res.users.data.filter(u => u.isActive).length);
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
        console.error('Failed to load dashboard metrics', err);
        this.isLoading.set(false);
      }
    });
  }
}
