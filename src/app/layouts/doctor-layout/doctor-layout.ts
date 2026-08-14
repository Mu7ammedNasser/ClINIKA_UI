import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './doctor-layout.html',
  styleUrl: './doctor-layout.css',
})
export class DoctorLayout {
  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
