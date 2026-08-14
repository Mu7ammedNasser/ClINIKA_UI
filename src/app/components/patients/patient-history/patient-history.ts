import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { PatientHistoryDto } from '../../../core/interfaces/patient.interfaces';

@Component({
  selector: 'app-patient-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-history.html',
  styleUrl: './patient-history.css',
})
export class PatientHistory implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  history: PatientHistoryDto | null = null;
  isLoading = true;
  error = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchHistory(+id);
    } else {
      this.error = 'Invalid patient ID.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  fetchHistory(id: number) {
    this.patientService.getPatientHistory(id).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.history = res.data;
        } else {
          this.error = 'Failed to load patient history.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'An error occurred while fetching history.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
