import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AllergyService } from '../../../core/services/allergy.service';
import { AllergyDto } from '../../../core/interfaces/allergy.interfaces';

@Component({
  selector: 'app-allergy-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './allergy-management.html',
  styleUrl: './allergy-management.css',
})
export class AllergyManagement implements OnInit {
  private readonly allergyService = inject(AllergyService);
  private readonly fb = inject(FormBuilder);

  readonly allergies = signal<AllergyDto[]>([]);
  readonly isLoading = signal(false);

  // Filters
  readonly searchQuery = signal('');

  readonly filteredAllergies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    
    return this.allergies().filter(allergy => {
      return query ? (
        allergy.allergenName.toLowerCase().includes(query) ||
        allergy.allergyType.toLowerCase().includes(query)
      ) : true;
    });
  });
  
  // Modal state
  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly editMode = signal(false);
  readonly selectedAllergyId = signal<number | null>(null);

  // Toast state
  readonly toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly allergyForm = this.fb.nonNullable.group({
    allergenName: ['', [Validators.required, Validators.minLength(2)]],
    allergyType: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadAllergies();
  }

  loadAllergies(): void {
    this.isLoading.set(true);
    this.allergyService.getAllergies().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.allergies.set(res.data);
        } else {
          this.showToast('error', res.message || 'Failed to load allergies');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showToast('error', err.error?.message || 'Unable to connect. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  openModal(allergy?: AllergyDto): void {
    if (allergy) {
      this.editMode.set(true);
      this.selectedAllergyId.set(allergy.id);
      this.allergyForm.patchValue({
        allergenName: allergy.allergenName,
        allergyType: allergy.allergyType
      });
    } else {
      this.editMode.set(false);
      this.selectedAllergyId.set(null);
      this.allergyForm.reset();
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSubmit(): void {
    if (this.allergyForm.invalid) {
      this.allergyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.allergyForm.getRawValue();

    const apiCall = this.editMode() && this.selectedAllergyId()
      ? this.allergyService.updateAllergy(this.selectedAllergyId()!, formData)
      : this.allergyService.createAllergy(formData);

    apiCall.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        // Handle no content (204) correctly
        if (res == null || (res.isSuccess !== undefined && res.isSuccess) || (res.isSuccess === undefined)) {
          this.showToast('success', this.editMode() ? 'Allergy updated successfully.' : 'Allergy created successfully.');
          this.closeModal();
          this.loadAllergies();
        } else {
          this.showToast('error', res.message || 'Failed to save allergy.');
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
        this.showToast('error', err.error?.message || 'Error occurred while saving allergy.');
      }
    });
  }

  deleteAllergy(id: number): void {
    if (confirm('Are you sure you want to delete this allergy?')) {
      this.allergyService.deleteAllergy(id).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.showToast('success', res.message || 'Allergy deleted successfully.');
            this.loadAllergies();
          } else {
            this.showToast('error', res.message || 'Failed to delete allergy.');
          }
        },
        error: (err) => {
          this.showToast('error', err.error?.message || 'Error occurred while deleting allergy.');
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
