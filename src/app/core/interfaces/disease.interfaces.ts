export interface DiseaseDto {
  id: number;
  diseaseCode: string;
  diseaseName: string;
  description: string;
}

export interface CreateDiseaseRequest {
  diseaseCode: string;
  diseaseName: string;
  description: string;
}
