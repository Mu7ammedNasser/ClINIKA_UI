import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserDto } from '../../../core/interfaces/user.interfaces';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<UserDto[]>([]);
  readonly isLoading = signal(false);

  // Filters
  readonly searchQuery = signal('');
  readonly roleFilter = signal('All');

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    
    return this.users().filter(user => {
      const matchesSearch = query ? (
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phoneNumber && user.phoneNumber.includes(query))
      ) : true;
      
      const matchesRole = role === 'All' ? true : (
        user.roles && user.roles.includes(role)
      );
      
      return matchesSearch && matchesRole;
    });
  });
  
  // Modal state
  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);

  // Toast state
  readonly toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form for Add User
  readonly userForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Patient', [Validators.required]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.users.set(res.data);
        } else {
          this.showToast('error', res.message || 'Failed to load users');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Unable to connect. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  toggleUserStatus(user: UserDto): void {
    // Optimistic UI update or disable toggle during loading can be done.
    // For safety, let's call the API first then update the row.
    const originalStatus = user.isActive;
    
    // Optimistically toggle
    this.users.update(current => 
      current.map(u => u.id === user.id ? { ...u, isActive: !originalStatus } : u)
    );

    const apiCall = originalStatus 
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);

    apiCall.subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.showToast('success', res.message || `User successfully ${originalStatus ? 'deactivated' : 'activated'}.`);
        } else {
          // Revert optimistic update
          this.users.update(current => 
            current.map(u => u.id === user.id ? { ...u, isActive: originalStatus } : u)
          );
          this.showToast('error', res.message || 'Failed to update user status.');
        }
      },
      error: (err) => {
        // Revert optimistic update
        this.users.update(current => 
          current.map(u => u.id === user.id ? { ...u, isActive: originalStatus } : u)
        );
        this.showToast('error', err.error?.message || 'Error occurred while updating user status.');
      }
    });
  }

  openModal(): void {
    this.userForm.reset({ role: 'Patient' });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.userService.createUser(this.userForm.getRawValue()).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.isSuccess) {
          this.showToast('success', res.message || 'User created successfully.');
          this.closeModal();
          this.loadUsers(); // Refresh the list
        } else {
          this.showToast('error', res.message || 'Failed to create user.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        
        // Handle standard .NET validation errors or custom error responses
        if (err.error?.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          const validationMessage = err.error.errors[firstErrorKey][0];
          this.showToast('error', validationMessage);
          return;
        }

        this.showToast('error', err.error?.message || 'Unable to connect. Please check your connection.');
      }
    });
  }

  showToast(type: 'success' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
