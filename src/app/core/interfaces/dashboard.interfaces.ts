export interface TopDiseaseItem {
  diseaseName: string;
  count: number;
}

export interface DashboardSummaryData {
  totalUsers: number;
  totalAiSessions: number;
  topDiseases: TopDiseaseItem[];
}
