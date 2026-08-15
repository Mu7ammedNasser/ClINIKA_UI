import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null for getToken when no token stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return false for isAuthenticated when no token stored', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null for getUserRole when no user stored', () => {
    expect(service.getUserRole()).toBeNull();
  });

  it('should clear stored credentials on logout and navigate to login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    localStorage.setItem('clinika_token', 'sample-token');
    localStorage.setItem('clinika_user', JSON.stringify({ email: 'test@clinika.com' }));

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
