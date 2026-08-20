import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { PatientSessions } from './patient-sessions';

describe('PatientSessions', () => {
  let component: PatientSessions;
  let fixture: ComponentFixture<PatientSessions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSessions],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientSessions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
