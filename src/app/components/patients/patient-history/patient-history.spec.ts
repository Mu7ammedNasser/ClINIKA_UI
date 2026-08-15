import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PatientHistory } from './patient-history';

describe('PatientHistory', () => {
  let component: PatientHistory;
  let fixture: ComponentFixture<PatientHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientHistory],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set error for invalid patient ID when no route param', () => {
    expect(component.error).toBe('Invalid patient ID.');
    expect(component.isLoading).toBe(false);
  });

  it('should initialize with null history', () => {
    expect(component.history).toBeNull();
  });
});
