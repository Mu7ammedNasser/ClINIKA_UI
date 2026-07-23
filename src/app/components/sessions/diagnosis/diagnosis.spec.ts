import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Diagnosis } from './diagnosis';

describe('Diagnosis', () => {
  let component: Diagnosis;
  let fixture: ComponentFixture<Diagnosis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagnosis]
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
