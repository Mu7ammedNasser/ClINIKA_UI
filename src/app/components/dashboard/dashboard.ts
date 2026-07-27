import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
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

  readonly totalUsers = signal<number>(0);
  readonly activeUsers = signal<number>(0);
  readonly totalRoles = signal<number>(0);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.isLoading.set(true);
    
    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles()
    }).subscribe({
      next: (res) => {
        if (res.users.isSuccess && res.users.data) {
          this.totalUsers.set(res.users.data.length);
          this.activeUsers.set(res.users.data.filter(u => u.isActive).length);
        }
        if (res.roles.isSuccess && res.roles.data) {
          this.totalRoles.set(res.roles.data.length);
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
