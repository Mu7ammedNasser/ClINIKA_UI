import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { DiseaseManagement } from './disease-management';
import { DiseaseDto } from '../../../core/interfaces/disease.interfaces';

describe('DiseaseManagement', () => {
  let component: DiseaseManagement;
  let fixture: ComponentFixture<DiseaseManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiseaseManagement],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DiseaseManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    expect(component.diseases()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.searchQuery()).toBe('');
    expect(component.isModalOpen()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
    expect(component.editMode()).toBe(false);
    expect(component.selectedDiseaseId()).toBeNull();
  });

  it('should have disease form with diseaseCode, diseaseName, and description controls', () => {
    expect(component.diseaseForm.contains('diseaseCode')).toBe(true);
    expect(component.diseaseForm.contains('diseaseName')).toBe(true);
    expect(component.diseaseForm.contains('description')).toBe(true);
  });

  it('should mark form invalid when empty', () => {
    expect(component.diseaseForm.valid).toBe(false);
  });

  it('should validate minimum length for diseaseCode and diseaseName', () => {
    const codeCtrl = component.diseaseForm.get('diseaseCode')!;
    const nameCtrl = component.diseaseForm.get('diseaseName')!;

    codeCtrl.setValue('A');
    expect(codeCtrl.hasError('minlength')).toBe(true);
    codeCtrl.setValue('D01');
    expect(codeCtrl.hasError('minlength')).toBe(false);

    nameCtrl.setValue('B');
    expect(nameCtrl.hasError('minlength')).toBe(true);
    nameCtrl.setValue('Diabetes');
    expect(nameCtrl.hasError('minlength')).toBe(false);
  });

  it('should mark form valid with proper data', () => {
    component.diseaseForm.patchValue({
      diseaseCode: 'D01',
      diseaseName: 'Hypertension',
      description: 'High blood pressure condition',
    });
    expect(component.diseaseForm.valid).toBe(true);
  });

  it('should filter diseases by code, name, and description', () => {
    const sampleDiseases: DiseaseDto[] = [
      { id: 1, diseaseCode: 'HT01', diseaseName: 'Hypertension', description: 'High blood pressure' },
      { id: 2, diseaseCode: 'DB02', diseaseName: 'Diabetes Type 2', description: 'Chronic blood sugar condition' },
      { id: 3, diseaseCode: 'AS03', diseaseName: 'Asthma', description: 'Respiratory airways condition' },
    ];
    component.diseases.set(sampleDiseases);

    component.searchQuery.set('hyper');
    expect(component.filteredDiseases().length).toBe(1);
    expect(component.filteredDiseases()[0].diseaseName).toBe('Hypertension');

    component.searchQuery.set('respiratory');
    expect(component.filteredDiseases().length).toBe(1);
    expect(component.filteredDiseases()[0].diseaseName).toBe('Asthma');

    component.searchQuery.set('db02');
    expect(component.filteredDiseases().length).toBe(1);

    component.searchQuery.set('');
    expect(component.filteredDiseases().length).toBe(3);
  });

  it('should open modal in create mode when no disease is passed', () => {
    component.openModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.editMode()).toBe(false);
    expect(component.selectedDiseaseId()).toBeNull();
  });

  it('should open modal in edit mode with populated form when disease is passed', () => {
    const disease: DiseaseDto = {
      id: 10,
      diseaseCode: 'CV01',
      diseaseName: 'Cardiovascular Disease',
      description: 'Heart conditions',
    };
    component.openModal(disease);
    expect(component.isModalOpen()).toBe(true);
    expect(component.editMode()).toBe(true);
    expect(component.selectedDiseaseId()).toBe(10);
    expect(component.diseaseForm.getRawValue().diseaseCode).toBe('CV01');
    expect(component.diseaseForm.getRawValue().diseaseName).toBe('Cardiovascular Disease');
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
    component.showToast('success', 'Disease saved successfully');
    expect(component.toastMessage()).toEqual({ type: 'success', text: 'Disease saved successfully' });
  });
});
