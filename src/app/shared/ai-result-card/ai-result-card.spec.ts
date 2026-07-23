import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiResultCard } from './ai-result-card';

describe('AiResultCard', () => {
  let component: AiResultCard;
  let fixture: ComponentFixture<AiResultCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiResultCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiResultCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
