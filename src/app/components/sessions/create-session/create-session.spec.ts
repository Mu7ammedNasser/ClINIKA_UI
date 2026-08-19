import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CreateSession } from './create-session';

describe('CreateSession', () => {
  let component: CreateSession;
  let fixture: ComponentFixture<CreateSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSession],
      providers: [provideHttpClient(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSession);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
