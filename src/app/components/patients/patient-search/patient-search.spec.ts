import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSearch } from './patient-search';

describe('PatientSearch', () => {
  let component: PatientSearch;
  let fixture: ComponentFixture<PatientSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
