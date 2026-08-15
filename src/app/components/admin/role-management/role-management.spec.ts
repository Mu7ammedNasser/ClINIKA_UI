import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RoleManagement } from './role-management';

describe('RoleManagement', () => {
  let component: RoleManagement;
  let fixture: ComponentFixture<RoleManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleManagement],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    expect(component.roles()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.isModalOpen()).toBe(false);
    expect(component.selectedRole()).toBeNull();
    expect(component.isLoadingDetails()).toBe(false);
  });

  it('should close modal and clear selected role', () => {
    component.isModalOpen.set(true);
    component.selectedRole.set({ id: '1', name: 'Admin', description: 'System Administrator' });
    component.closeModal();
    expect(component.isModalOpen()).toBe(false);
    expect(component.selectedRole()).toBeNull();
  });

  it('should display toast messages correctly', () => {
    component.showToast('error', 'Failed to load roles');
    expect(component.toastMessage()).toEqual({ type: 'error', text: 'Failed to load roles' });
  });
});
