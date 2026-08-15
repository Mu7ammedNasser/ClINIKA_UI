import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PatientLayout } from './patient-layout';
import { AuthService } from '../../core/services/auth.service';

describe('PatientLayout', () => {
  let component: PatientLayout;
  let fixture: ComponentFixture<PatientLayout>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientLayout],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientLayout);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.logout on logout', () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    component.logout();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
