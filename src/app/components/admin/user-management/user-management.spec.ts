import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { UserManagement } from './user-management';
import { UserDto } from '../../../core/interfaces/user.interfaces';

describe('UserManagement', () => {
  let component: UserManagement;
  let fixture: ComponentFixture<UserManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagement],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    expect(component.users()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.searchQuery()).toBe('');
    expect(component.roleFilter()).toBe('All');
    expect(component.isModalOpen()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have user form with all required controls', () => {
    const form = component.userForm;
    expect(form.contains('firstName')).toBe(true);
    expect(form.contains('lastName')).toBe(true);
    expect(form.contains('email')).toBe(true);
    expect(form.contains('password')).toBe(true);
    expect(form.contains('role')).toBe(true);
    expect(form.contains('phoneNumber')).toBe(true);
  });

  it('should validate email format in userForm', () => {
    const emailCtrl = component.userForm.get('email')!;
    emailCtrl.setValue('bad-email');
    expect(emailCtrl.hasError('email')).toBe(true);

    emailCtrl.setValue('doctor@clinika.com');
    expect(emailCtrl.hasError('email')).toBe(false);
  });

  it('should validate phone number pattern (10-15 digits)', () => {
    const phoneCtrl = component.userForm.get('phoneNumber')!;
    phoneCtrl.setValue('123');
    expect(phoneCtrl.hasError('pattern')).toBe(true);

    phoneCtrl.setValue('01234567890');
    expect(phoneCtrl.hasError('pattern')).toBe(false);
  });

  it('should mark form valid with proper data', () => {
    component.userForm.patchValue({
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@clinika.com',
      password: 'StrongPassword123',
      role: 'Doctor',
      phoneNumber: '01012345678',
    });
    expect(component.userForm.valid).toBe(true);
  });

  it('should filter users by search query and role', () => {
    const sampleUsers: UserDto[] = [
      { id: '1', firstName: 'Ahmad', lastName: 'Ali', email: 'ahmad@clinika.com', phoneNumber: '01012345678', isActive: true, roles: ['Doctor'] },
      { id: '2', firstName: 'Mona', lastName: 'Zaki', email: 'mona@clinika.com', phoneNumber: '01112345678', isActive: true, roles: ['Patient'] },
      { id: '3', firstName: 'Karim', lastName: 'Adel', email: 'karim@clinika.com', phoneNumber: '01212345678', isActive: false, roles: ['Admin'] },
    ];
    component.users.set(sampleUsers);

    component.searchQuery.set('ahmad');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].firstName).toBe('Ahmad');

    component.searchQuery.set('');
    component.roleFilter.set('Patient');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].firstName).toBe('Mona');

    component.roleFilter.set('All');
    expect(component.filteredUsers().length).toBe(3);
  });

  it('should open modal and reset form with default role Patient', () => {
    component.openModal();
    expect(component.isModalOpen()).toBe(true);
    expect(component.userForm.getRawValue().role).toBe('Patient');
  });

  it('should close modal', () => {
    component.openModal();
    expect(component.isModalOpen()).toBe(true);
    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should display toast messages', () => {
    component.showToast('success', 'User created successfully');
    expect(component.toastMessage()).toEqual({ type: 'success', text: 'User created successfully' });
  });
});
