import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionCheck } from './interaction-check';

describe('InteractionCheck', () => {
  let component: InteractionCheck;
  let fixture: ComponentFixture<InteractionCheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionCheck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractionCheck);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
