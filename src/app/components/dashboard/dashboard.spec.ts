import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize admin counters to zero', () => {
    expect(component.totalUsers()).toBe(0);
    expect(component.activeUsers()).toBe(0);
    expect(component.totalRoles()).toBe(0);
    expect(component.totalDiseases()).toBe(0);
    expect(component.totalAllergies()).toBe(0);
  });

  it('should initialize doctor counters to zero', () => {
    expect(component.doctorTotalSessions()).toBe(0);
    expect(component.doctorTotalPatients()).toBe(0);
    expect(component.doctorAiDiagnoses()).toBe(0);
  });

  it('should have a role signal', () => {
    expect(component.role).toBeDefined();
  });
});
