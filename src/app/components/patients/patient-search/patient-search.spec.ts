import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PatientSearch } from './patient-search';

describe('PatientSearch', () => {
  let component: PatientSearch;
  let fixture: ComponentFixture<PatientSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSearch],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search term and no patient', () => {
    expect(component.searchTerm).toBe('');
    expect(component.patient).toBeNull();
    expect(component.error).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should not search when search term is empty', () => {
    component.searchTerm = '';
    component.search();
    expect(component.isLoading).toBe(false);
  });

  it('should not search when search term is only whitespace', () => {
    component.searchTerm = '   ';
    component.search();
    expect(component.isLoading).toBe(false);
  });

  it('should set isLoading to true when searching with a valid term', () => {
    component.searchTerm = 'John';
    component.search();
    expect(component.isLoading).toBe(true);
  });

  it('should clear previous error and patient when starting a new search', () => {
    component.error = 'Previous error';
    component.patient = { patientId: 1, firstName: 'Test', lastName: 'User', email: 'test@test.com' } as any;
    component.searchTerm = 'NewSearch';
    component.search();
    expect(component.error).toBe('');
    expect(component.patient).toBeNull();
  });
});
