import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Diagnosis } from './diagnosis';

describe('Diagnosis', () => {
  let component: Diagnosis;
  let fixture: ComponentFixture<Diagnosis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagnosis],
      providers: [provideHttpClient(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Diagnosis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
