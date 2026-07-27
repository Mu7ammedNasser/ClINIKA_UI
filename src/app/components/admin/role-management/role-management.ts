import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../../core/services/role.service';
import { RoleDto } from '../../../core/interfaces/role.interfaces';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
})
export class RoleManagement implements OnInit {
  private readonly roleService = inject(RoleService);

  readonly roles = signal<RoleDto[]>([]);
  readonly isLoading = signal(false);
  
  // Modal state
  readonly isModalOpen = signal(false);
  readonly selectedRole = signal<RoleDto | null>(null);
  readonly isLoadingDetails = signal(false);

  // Toast state
  readonly toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.roles.set(res.data);
        } else {
          this.showToast('error', res.message || 'Failed to load roles');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Unable to connect. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  viewRole(id: string): void {
    this.isModalOpen.set(true);
    this.isLoadingDetails.set(true);
    this.selectedRole.set(null); // Clear previous

    this.roleService.getRoleById(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.selectedRole.set(res.data);
        } else {
          this.showToast('error', res.message || 'Failed to fetch role details.');
          this.closeModal();
        }
        this.isLoadingDetails.set(false);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Error occurred while fetching role.');
        this.isLoadingDetails.set(false);
        this.closeModal();
      }
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedRole.set(null);
  }

  showToast(type: 'success' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
