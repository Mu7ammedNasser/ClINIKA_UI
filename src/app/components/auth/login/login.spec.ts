import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading false and no error', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should have email and password form controls', () => {
    expect(component.loginForm.contains('email')).toBe(true);
    expect(component.loginForm.contains('password')).toBe(true);
  });

  it('should mark form as invalid when empty', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should require a valid email format', () => {
    const emailControl = component.loginForm.get('email')!;
    emailControl.setValue('not-an-email');
    expect(emailControl.hasError('email')).toBe(true);

    emailControl.setValue('user@example.com');
    expect(emailControl.hasError('email')).toBe(false);
  });

  it('should require password with minimum 6 characters', () => {
    const passwordControl = component.loginForm.get('password')!;
    passwordControl.setValue('123');
    expect(passwordControl.hasError('minlength')).toBe(true);

    passwordControl.setValue('123456');
    expect(passwordControl.hasError('minlength')).toBe(false);
  });

  it('should mark form as valid with correct values', () => {
    component.loginForm.patchValue({
      email: 'user@example.com',
      password: 'SecurePass123',
    });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });
});
