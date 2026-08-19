import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PatientService } from '../../core/services/patient.service';
import { DiseaseService } from '../../core/services/disease.service';
import { AllergyService } from '../../core/services/allergy.service';
import { PatientProfileDto, PatientMedicalDataDto, UpdateMedicalInfoRequest } from '../../core/interfaces/patient.interfaces';
import { DiseaseDto } from '../../core/interfaces/disease.interfaces';
import { AllergyDto } from '../../core/interfaces/allergy.interfaces';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private diseaseService = inject(DiseaseService);
  private allergyService = inject(AllergyService);

  readonly maxDate = new Date().toISOString().split('T')[0];

  profileForm!: FormGroup;
  
  isLoading = signal(true);
  isSubmitting = signal(false);
  
  systemDiseases = signal<DiseaseDto[]>([]);
  systemAllergies = signal<AllergyDto[]>([]);

  patientProfile = signal<PatientProfileDto | null>(null);

  toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly confirmDeleteModal = signal<{
    index: number;
    drugName: string;
    sourceSessionId?: number | null;
    doctorName?: string | null;
  } | null>(null);

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  private pastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        return { futureDate: true };
      }
      const minDate = new Date('1900-01-01');
      if (inputDate < minDate) {
        return { invalidDate: true };
      }
      return null;
    };
  }

  private initForm() {
    this.profileForm = this.fb.group({
      gender: ['', Validators.required],
      bloodType: ['', Validators.required],
      nationalId: ['', [Validators.required, Validators.pattern('^[0-9]{14}$')]],
      dateOfBirth: ['', [Validators.required, this.pastDateValidator()]],
      medications: this.fb.array([]),
      diseases: this.fb.array([]),
      allergies: this.fb.array([])
    });
  }

  get medications() {
    return this.profileForm.get('medications') as FormArray;
  }

  get diseases() {
    return this.profileForm.get('diseases') as FormArray;
  }

  get allergies() {
    return this.profileForm.get('allergies') as FormArray;
  }

  addMedication() {
    this.medications.push(this.fb.group({
      drugName: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      sourceSessionId: [null],
      prescribedByDoctor: [null],
      sourceSessionDate: [null]
    }));
  }

  removeMedication(index: number) {
    const med = this.medications.at(index)?.value;
    if (med && (med.sourceSessionId || med.prescribedByDoctor)) {
      this.confirmDeleteModal.set({
        index,
        drugName: med.drugName || 'this medication',
        sourceSessionId: med.sourceSessionId,
        doctorName: med.prescribedByDoctor
      });
    } else {
      this.medications.removeAt(index);
    }
  }

  confirmRemoveMedication() {
    const target = this.confirmDeleteModal();
    if (target) {
      this.medications.removeAt(target.index);
      this.confirmDeleteModal.set(null);
    }
  }

  cancelRemoveMedication() {
    this.confirmDeleteModal.set(null);
  }

  addDisease() {
    this.diseases.push(this.fb.group({
      isCustom: [false],
      diseaseId: [null, Validators.required],
      rawDiseaseName: [{ value: null, disabled: true }],
      diagnosedDate: ['', Validators.required]
    }));
  }

  removeDisease(index: number) {
    this.diseases.removeAt(index);
  }

  onDiseaseCustomToggle(index: number) {
    const group = this.diseases.at(index) as FormGroup;
    const isCustom = group.get('isCustom')?.value;
    
    if (isCustom) {
      group.get('diseaseId')?.setValue(null);
      group.get('diseaseId')?.clearValidators();
      group.get('diseaseId')?.disable();
      group.get('rawDiseaseName')?.setValidators(Validators.required);
      group.get('rawDiseaseName')?.enable();
    } else {
      group.get('rawDiseaseName')?.setValue(null);
      group.get('rawDiseaseName')?.clearValidators();
      group.get('rawDiseaseName')?.disable();
      group.get('diseaseId')?.setValidators(Validators.required);
      group.get('diseaseId')?.enable();
    }
    group.get('diseaseId')?.updateValueAndValidity();
    group.get('rawDiseaseName')?.updateValueAndValidity();
  }

  addAllergy() {
    this.allergies.push(this.fb.group({
      isCustom: [false],
      allergyId: [null, Validators.required],
      rawAllergenName: [{ value: null, disabled: true }],
      severity: ['Mild', Validators.required]
    }));
  }

  removeAllergy(index: number) {
    this.allergies.removeAt(index);
  }

  onAllergyCustomToggle(index: number) {
    const group = this.allergies.at(index) as FormGroup;
    const isCustom = group.get('isCustom')?.value;
    
    if (isCustom) {
      group.get('allergyId')?.setValue(null);
      group.get('allergyId')?.clearValidators();
      group.get('allergyId')?.disable();
      group.get('rawAllergenName')?.setValidators(Validators.required);
      group.get('rawAllergenName')?.enable();
    } else {
      group.get('rawAllergenName')?.setValue(null);
      group.get('rawAllergenName')?.clearValidators();
      group.get('rawAllergenName')?.disable();
      group.get('allergyId')?.setValidators(Validators.required);
      group.get('allergyId')?.enable();
    }
    group.get('allergyId')?.updateValueAndValidity();
    group.get('rawAllergenName')?.updateValueAndValidity();
  }

  private loadData() {
    this.isLoading.set(true);
    
    forkJoin({
      profile: this.patientService.getProfile(),
      medicalData: this.patientService.getMedicalData(),
      diseases: this.diseaseService.getDiseases(),
      allergies: this.allergyService.getAllergies()
    }).subscribe({
      next: (res) => {
        if (res.diseases.isSuccess && res.diseases.data) {
          this.systemDiseases.set(res.diseases.data);
        }
        
        if (res.allergies.isSuccess && res.allergies.data) {
          this.systemAllergies.set(res.allergies.data);
        }

        if (res.profile.isSuccess && res.profile.data) {
          this.patientProfile.set(res.profile.data);
          this.profileForm.patchValue({
            gender: res.profile.data.gender || '',
            bloodType: res.profile.data.bloodType || '',
            nationalId: res.profile.data.nationalId || '',
            dateOfBirth: res.profile.data.dateOfBirth ? res.profile.data.dateOfBirth.split('T')[0] : ''
          });
        }

        if (res.medicalData.isSuccess && res.medicalData.data) {
          const medData = res.medicalData.data;
          
          medData.activeMedications.forEach(med => {
            this.medications.push(this.fb.group({
              drugName: [med.drugName, Validators.required],
              dosage: [med.dosage, Validators.required],
              frequency: [med.frequency, Validators.required],
              sourceSessionId: [med.sourceSessionId || null],
              prescribedByDoctor: [med.prescribedByDoctor || null],
              sourceSessionDate: [med.sourceSessionDate || null]
            }));
          });

          medData.diseases.forEach(d => {
            const isCustom = d.diseaseCode === 'CUSTOM';
            let diseaseId = null;
            let rawDiseaseName = null;

            if (isCustom) {
              rawDiseaseName = d.diseaseName;
            } else {
              const found = this.systemDiseases().find(sd => sd.diseaseCode === d.diseaseCode);
              if (found) {
                diseaseId = found.id;
              }
            }

            const group = this.fb.group({
              isCustom: [isCustom],
              diseaseId: [{ value: diseaseId, disabled: isCustom }, isCustom ? [] : [Validators.required]],
              rawDiseaseName: [{ value: rawDiseaseName, disabled: !isCustom }, isCustom ? [Validators.required] : []],
              diagnosedDate: [d.diagnosedDate ? d.diagnosedDate.split('T')[0] : '', Validators.required]
            });
            this.diseases.push(group);
          });

          medData.allergies.forEach(a => {
            const found = this.systemAllergies().find(sa => sa.allergenName.toLowerCase() === a.allergenName.toLowerCase());
            const isCustom = !found;
            let allergyId = null;
            let rawAllergenName = null;

            if (isCustom) {
              rawAllergenName = a.allergenName;
            } else {
              allergyId = found?.id;
            }

            const group = this.fb.group({
              isCustom: [isCustom],
              allergyId: [{ value: allergyId, disabled: isCustom }, isCustom ? [] : [Validators.required]],
              rawAllergenName: [{ value: rawAllergenName, disabled: !isCustom }, isCustom ? [Validators.required] : []],
              severity: [a.severity || 'Mild', Validators.required]
            });
            this.allergies.push(group);
          });
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile data', err);
        this.showToast('error', 'Failed to load profile data');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showToast('error', 'Please correct the highlighted fields before saving.');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.profileForm.getRawValue();

    const request: UpdateMedicalInfoRequest = {
      gender: formValue.gender,
      bloodType: formValue.bloodType,
      nationalId: formValue.nationalId,
      dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth).toISOString() : '',
      medications: formValue.medications.map((m: any) => ({
        drugName: m.drugName,
        dosage: m.dosage,
        frequency: m.frequency
      })),
      diseases: formValue.diseases.map((d: any) => ({
        diseaseId: d.isCustom ? null : d.diseaseId,
        rawDiseaseName: d.isCustom ? d.rawDiseaseName : null,
        diagnosedDate: d.diagnosedDate ? new Date(d.diagnosedDate).toISOString() : ''
      })),
      allergies: formValue.allergies.map((a: any) => ({
        allergyId: a.isCustom ? null : a.allergyId,
        rawAllergenName: a.isCustom ? a.rawAllergenName : null,
        severity: a.severity
      }))
    };

    this.patientService.updateMedicalInfo(request).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.showToast('success', 'Profile updated successfully!');
        } else {
          this.showToast('error', res.message || 'Failed to update profile');
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Update failed', err);
        let errorMsg = 'An error occurred while updating profile.';
        if (err.error?.errors) {
          if (typeof err.error.errors === 'object') {
            const errorEntries = Object.values(err.error.errors).flat();
            if (errorEntries.length > 0) {
              errorMsg = errorEntries.join('; ');
            }
          } else if (typeof err.error.errors === 'string') {
            errorMsg = err.error.errors;
          }
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.showToast('error', errorMsg);
        this.isSubmitting.set(false);
      }
    });
  }

  private showToast(type: 'success' | 'error', text: string) {
    this.toastMessage.set({ type, text });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
