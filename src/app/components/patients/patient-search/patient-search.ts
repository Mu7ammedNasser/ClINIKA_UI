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
    if (!this.searchTerm.trim()) return;
    this.isLoading = true;
    this.error = '';
    this.patient = null;
    this.cdr.detectChanges();

    this.patientService.searchPatient(this.searchTerm).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.patient = res.data;
        } else {
          this.error = 'Patient not found.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Patient not found or an error occurred.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
