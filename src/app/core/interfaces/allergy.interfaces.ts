export interface AllergyDto {
  id: number;
  allergenName: string;
  allergyType: string;
}

export interface CreateAllergyRequest {
  allergenName: string;
  allergyType: string;
}
