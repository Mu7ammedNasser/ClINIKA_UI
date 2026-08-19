import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminDashboard } from './admin-dashboard';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummaryData } from '../../../core/interfaces/dashboard.interfaces';
import { ApiResponse } from '../../../core/interfaces/auth.interfaces';

describe('AdminDashboard', () => {
  let component: AdminDashboard;
  let fixture: ComponentFixture<AdminDashboard>;

  const mockSummaryData: ApiResponse<DashboardSummaryData> = {
    data: {
      totalUsers: 14,
      totalAiSessions: 22,
      topDiseases: [
        { diseaseName: 'Panadol (Paracetamol)', count: 150 },
        { diseaseName: 'Amoxil (Amoxicillin)', count: 120 },
        { diseaseName: 'Cataflam (Diclofenac)', count: 95 },
      ],
    },
    isSuccess: true,
    status: 'Success',
    message: 'Operation completed successfully.',
  };

  beforeEach(async () => {
    const dashboardServiceMock = {
      getDashboardSummary: () => of(mockSummaryData),
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardService, useValue: dashboardServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and load dashboard summary data', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.summaryData()?.totalUsers).toBe(14);
    expect(component.summaryData()?.totalAiSessions).toBe(22);
    expect(component.topDiseases().length).toBe(3);
  });

  it('should compute total disease consultations and percentages correctly', () => {
    expect(component.totalDiseaseConsultations()).toBe(365);
    expect(component.getPercentage(150)).toBe(41);
  });

  it('should toggle chart view', () => {
    expect(component.activeChartView()).toBe('bars');
    component.setChartView('donut');
    expect(component.activeChartView()).toBe('donut');
  });
});
