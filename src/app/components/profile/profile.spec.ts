import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Profile } from './profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize profile form with required fields', () => {
    expect(component.profileForm).toBeDefined();
    expect(component.profileForm.contains('gender')).toBe(true);
    expect(component.profileForm.contains('bloodType')).toBe(true);
    expect(component.profileForm.contains('nationalId')).toBe(true);
    expect(component.profileForm.contains('dateOfBirth')).toBe(true);
  });

  it('should have empty FormArrays for medications, diseases, and allergies', () => {
    expect(component.medications.length).toBe(0);
    expect(component.diseases.length).toBe(0);
    expect(component.allergies.length).toBe(0);
  });

  it('should add a medication entry', () => {
    component.addMedication();
    expect(component.medications.length).toBe(1);
    component.addMedication();
    expect(component.medications.length).toBe(2);
  });

  it('should remove a medication entry', () => {
    component.addMedication();
    component.addMedication();
    component.removeMedication(0);
    expect(component.medications.length).toBe(1);
  });

  it('should add a disease entry', () => {
    component.addDisease();
    expect(component.diseases.length).toBe(1);
  });

  it('should remove a disease entry', () => {
    component.addDisease();
    component.addDisease();
    component.removeDisease(0);
    expect(component.diseases.length).toBe(1);
  });

  it('should add an allergy entry', () => {
    component.addAllergy();
    expect(component.allergies.length).toBe(1);
  });

  it('should remove an allergy entry', () => {
    component.addAllergy();
    component.addAllergy();
    component.removeAllergy(0);
    expect(component.allergies.length).toBe(1);
  });

  it('should validate nationalId with exactly 14 digits', () => {
    const ctrl = component.profileForm.get('nationalId')!;
    ctrl.setValue('12345');
    expect(ctrl.hasError('pattern')).toBe(true);

    ctrl.setValue('12345678901234');
    expect(ctrl.hasError('pattern')).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should initialize with isSubmitting false', () => {
    expect(component.isSubmitting()).toBe(false);
  });
});
