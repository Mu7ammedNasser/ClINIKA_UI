import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DiseaseService } from '../../../core/services/disease.service';
import { DiseaseDto } from '../../../core/interfaces/disease.interfaces';

@Component({
  selector: 'app-disease-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './disease-management.html',
  styleUrl: './disease-management.css',
})
export class DiseaseManagement implements OnInit {
  private readonly diseaseService = inject(DiseaseService);
  private readonly fb = inject(FormBuilder);

  readonly diseases = signal<DiseaseDto[]>([]);
  readonly isLoading = signal(false);

  // Filters
  readonly searchQuery = signal('');

  readonly filteredDiseases = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    
    return this.diseases().filter(disease => {
      return query ? (
        disease.diseaseCode.toLowerCase().includes(query) ||
        disease.diseaseName.toLowerCase().includes(query) ||
        disease.description.toLowerCase().includes(query)
      ) : true;
    });
  });
  
  // Modal state
  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly editMode = signal(false);
  readonly selectedDiseaseId = signal<number | null>(null);

  // Toast state
  readonly toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form for Add/Edit Disease
  readonly diseaseForm = this.fb.nonNullable.group({
    diseaseCode: ['', [Validators.required, Validators.minLength(2)]],
    diseaseName: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadDiseases();
  }

  loadDiseases(): void {
    this.isLoading.set(true);
    this.diseaseService.getDiseases().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.diseases.set(res.data);
        } else {
          this.showToast('error', res.message || 'Failed to load diseases');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Unable to connect. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  openModal(disease?: DiseaseDto): void {
    if (disease) {
      this.editMode.set(true);
      this.selectedDiseaseId.set(disease.id);
      this.diseaseForm.patchValue({
        diseaseCode: disease.diseaseCode,
        diseaseName: disease.diseaseName,
        description: disease.description
      });
    } else {
      this.editMode.set(false);
      this.selectedDiseaseId.set(null);
      this.diseaseForm.reset();
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    if (this.diseaseForm.invalid) {
      this.diseaseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.diseaseForm.getRawValue();

    const apiCall = this.editMode() && this.selectedDiseaseId()
      ? this.diseaseService.updateDisease(this.selectedDiseaseId()!, formData)
      : this.diseaseService.createDisease(formData);

    apiCall.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        // Sometimes Put returns 204 with no body, so we handle it:
        if (res == null || (res.isSuccess !== undefined && res.isSuccess) || (res.isSuccess === undefined)) {
          this.showToast('success', this.editMode() ? 'Disease updated successfully.' : 'Disease created successfully.');
          this.closeModal();
          this.loadDiseases();
        } else {
          this.showToast('error', res.message || 'Failed to save disease.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.error?.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          const validationMessage = err.error.errors[firstErrorKey][0];
          this.showToast('error', validationMessage);
          return;
        }
        this.showToast('error', err.error?.message || 'Error occurred while saving disease.');
      }
    });
  }

  deleteDisease(id: number): void {
    if (confirm('Are you sure you want to delete this disease?')) {
      this.diseaseService.deleteDisease(id).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.showToast('success', res.message || 'Disease deleted successfully.');
            this.loadDiseases();
          } else {
            this.showToast('error', res.message || 'Failed to delete disease.');
          }
        },
        error: (err) => {
          this.showToast('error', err.error?.message || 'Error occurred while deleting disease.');
        }
      });
    }
  }

  showToast(type: 'success' | 'error', text: string): void {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
