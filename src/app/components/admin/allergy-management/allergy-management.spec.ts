import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AllergyManagement } from './allergy-management';
import { AllergyDto } from '../../../core/interfaces/allergy.interfaces';
import { AllergyService } from '../../../core/services/allergy.service';

describe('AllergyManagement', () => {
  let component: AllergyManagement;
  let fixture: ComponentFixture<AllergyManagement>;

  const mockAllergyService = {
    getAllergies: () => of({ isSuccess: true, data: [] as AllergyDto[] }),
    createAllergy: () => of({ isSuccess: true }),
    updateAllergy: () => of({ isSuccess: true }),
    deleteAllergy: () => of({ isSuccess: true }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllergyManagement],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AllergyService, useValue: mockAllergyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllergyManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    expect(component.allergies()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.searchQuery()).toBe('');
    expect(component.isModalOpen()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
    expect(component.editMode()).toBe(false);
    expect(component.selectedAllergyId()).toBeNull();
  });

  it('should have allergy form with allergenName and allergyType controls', () => {
    expect(component.allergyForm.contains('allergenName')).toBe(true);
    expect(component.allergyForm.contains('allergyType')).toBe(true);
  });

  it('should mark form invalid when empty', () => {
    expect(component.allergyForm.valid).toBe(false);
  });

  it('should validate allergenName minimum length of 2', () => {
    const ctrl = component.allergyForm.get('allergenName')!;
    ctrl.setValue('P');
    expect(ctrl.hasError('minlength')).toBe(true);

    ctrl.setValue('Penicillin');
    expect(ctrl.hasError('minlength')).toBe(false);
  });

  it('should mark form valid with proper data', () => {
    component.allergyForm.patchValue({
      allergenName: 'Peanuts',
      allergyType: 'Food',
    });
    expect(component.allergyForm.valid).toBe(true);
  });

  it('should filter allergies by allergenName and allergyType', () => {
    const sampleAllergies: AllergyDto[] = [
      { id: 1, allergenName: 'Penicillin', allergyType: 'Drug' },
      { id: 2, allergenName: 'Peanuts', allergyType: 'Food' },
      { id: 3, allergenName: 'Pollen', allergyType: 'Environmental' },
    ];
    component.allergies.set(sampleAllergies);

    component.searchQuery.set('peanut');
    expect(component.filteredAllergies().length).toBe(1);
    expect(component.filteredAllergies()[0].allergenName).toBe('Peanuts');

    component.searchQuery.set('drug');
    expect(component.filteredAllergies().length).toBe(1);
    expect(component.filteredAllergies()[0].allergenName).toBe('Penicillin');

    component.searchQuery.set('');
    expect(component.filteredAllergies().length).toBe(3);
  });

  it('should open modal in create mode when no allergy is passed', () => {
    component.openModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.editMode()).toBe(false);
    expect(component.selectedAllergyId()).toBeNull();
  });

  it('should open modal in edit mode with populated form when allergy is passed', () => {
    const allergy: AllergyDto = { id: 5, allergenName: 'Dust Mites', allergyType: 'Environmental' };
    component.openModal(allergy);
    expect(component.isModalOpen()).toBe(true);
    expect(component.editMode()).toBe(true);
    expect(component.selectedAllergyId()).toBe(5);
    expect(component.allergyForm.getRawValue().allergenName).toBe('Dust Mites');
    expect(component.allergyForm.getRawValue().allergyType).toBe('Environmental');
  });

  it('should close modal', () => {
    component.openModal();
    expect(component.isModalOpen()).toBe(true);
    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should display toast messages', () => {
    component.showToast('success', 'Allergy created');
    expect(component.toastMessage()).toEqual({ type: 'success', text: 'Allergy created' });
  });
});
