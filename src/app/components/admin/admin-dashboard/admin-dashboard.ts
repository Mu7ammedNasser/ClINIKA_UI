import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummaryData, TopDiseaseItem } from '../../../core/interfaces/dashboard.interfaces';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isRefreshing = signal<boolean>(false);
  readonly summaryData = signal<DashboardSummaryData | null>(null);
  readonly activeChartView = signal<'bars' | 'donut'>('bars');
  readonly hoveredIndex = signal<number | null>(null);

  // Computed metrics for charts
  readonly topDiseases = computed<TopDiseaseItem[]>(() => {
    return this.summaryData()?.topDiseases ?? [];
  });

  readonly totalDiseaseConsultations = computed<number>(() => {
    const list = this.topDiseases();
    return list.reduce((acc, curr) => acc + curr.count, 0);
  });

  readonly maxDiseaseCount = computed<number>(() => {
    const list = this.topDiseases();
    if (!list.length) return 1;
    return Math.max(...list.map(d => d.count), 1);
  });

  // Color palette for chart items
  readonly chartColors = [
    { fill: '#0077b6', light: '#e0f2fe', gradient: 'linear-gradient(90deg, #0077b6 0%, #00b4d8 100%)' },
    { fill: '#00b4d8', light: '#e0f7fa', gradient: 'linear-gradient(90deg, #00b4d8 0%, #90e0ef 100%)' },
    { fill: '#03045e', light: '#e0e7ff', gradient: 'linear-gradient(90deg, #03045e 0%, #0077b6 100%)' },
    { fill: '#059669', light: '#ecfdf5', gradient: 'linear-gradient(90deg, #059669 0%, #34d399 100%)' },
    { fill: '#7c3aed', light: '#f5f3ff', gradient: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)' },
    { fill: '#ea580c', light: '#fff7ed', gradient: 'linear-gradient(90deg, #ea580c 0%, #fb923c 100%)' },
  ];

  ngOnInit(): void {
    this.fetchDashboardSummary();
  }

  fetchDashboardSummary(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res && res.isSuccess && res.data) {
          this.summaryData.set(res.data);
        } else {
          this.errorMessage.set(res?.message || 'Unable to load dashboard data.');
        }
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard summary:', err);
        this.errorMessage.set('Connection error. Please verify network and try again.');
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
    });
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.fetchDashboardSummary();
  }

  setChartView(view: 'bars' | 'donut'): void {
    this.activeChartView.set(view);
  }

  getPercentage(count: number): number {
    const total = this.totalDiseaseConsultations();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getBarWidth(count: number): number {
    const max = this.maxDiseaseCount();
    if (max === 0) return 0;
    return Math.max(8, Math.round((count / max) * 100));
  }

  getColor(index: number) {
    return this.chartColors[index % this.chartColors.length];
  }

  // Helper calculation for SVG Donut segments
  getDonutSegments() {
    const list = this.topDiseases();
    const total = this.totalDiseaseConsultations();
    if (total === 0 || !list.length) return [];

    const circumference = 2 * Math.PI * 40; // r=40 -> ~251.327
    let cumulativePercent = 0;

    return list.map((item, index) => {
      const percent = (item.count / total) * 100;
      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulativePercent / 100) * circumference);
      cumulativePercent += percent;

      return {
        diseaseName: item.diseaseName,
        count: item.count,
        percent: Math.round(percent),
        strokeDasharray,
        strokeDashoffset,
        color: this.getColor(index).fill,
        lightColor: this.getColor(index).light,
      };
    });
  }
}
