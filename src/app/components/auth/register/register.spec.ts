import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with no loading, no error, no success', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
  });

  it('should have all required form controls', () => {
    const form = component.registerForm;
    expect(form.contains('firstName')).toBe(true);
    expect(form.contains('lastName')).toBe(true);
    expect(form.contains('phoneNumber')).toBe(true);
    expect(form.contains('email')).toBe(true);
    expect(form.contains('password')).toBe(true);
    expect(form.contains('confirmPassword')).toBe(true);
  });

  it('should mark form as invalid when empty', () => {
    expect(component.registerForm.valid).toBe(false);
  });

  it('should require first name with minimum 2 characters', () => {
    const ctrl = component.registerForm.get('firstName')!;
    ctrl.setValue('A');
    expect(ctrl.hasError('minlength')).toBe(true);

    ctrl.setValue('Ahmad');
    expect(ctrl.hasError('minlength')).toBe(false);
  });

  it('should require a valid email format', () => {
    const ctrl = component.registerForm.get('email')!;
    ctrl.setValue('invalid');
    expect(ctrl.hasError('email')).toBe(true);

    ctrl.setValue('user@example.com');
    expect(ctrl.hasError('email')).toBe(false);
  });

  it('should require phone number with 10-15 digits', () => {
    const ctrl = component.registerForm.get('phoneNumber')!;
    ctrl.setValue('123');
    expect(ctrl.hasError('pattern')).toBe(true);

    ctrl.setValue('01234567890');
    expect(ctrl.hasError('pattern')).toBe(false);
  });

  it('should detect password mismatch', () => {
    component.registerForm.patchValue({
      password: 'Password123',
      confirmPassword: 'DifferentPassword',
    });
    component.registerForm.updateValueAndValidity();
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should pass when passwords match', () => {
    component.registerForm.patchValue({
      firstName: 'Ahmad',
      lastName: 'Ali',
      phoneNumber: '01234567890',
      email: 'ahmad@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    component.registerForm.updateValueAndValidity();
    expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    expect(component.registerForm.valid).toBe(true);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword()).toBe(false);
    component.toggleConfirmPassword();
    expect(component.showConfirmPassword()).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });
});
