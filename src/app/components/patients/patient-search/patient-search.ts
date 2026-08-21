import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { PatientSearchDto } from '../../../core/interfaces/patient.interfaces';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './patient-search.html',
  styleUrl: './patient-search.css',
})
export class PatientSearch {
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  searchTerm = '';
  patient: PatientSearchDto | null = null;
  error = '';
  isLoading = false;

  search() {
    const term = this.searchTerm.trim();
    if (!term) {
      this.error = 'Please enter a patient National ID.';
      return;
    }

    if (!/^\d+$/.test(term) || term.length < 10 || term.length > 20) {
      this.error = 'Please enter a valid National ID.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.patient = null;
    this.cdr.detectChanges();

    this.patientService.searchPatient(term).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.patient = res.data;
        } else {
          this.error = res.message || 'No patient found with this National ID.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error =
          err.error?.message ||
          (err.status === 404
            ? 'No patient found with this National ID.'
            : 'Please enter a valid National ID.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
