export interface PeageRequest {
  vehiculeId: number;
  chauffeurId?: number;
  missionId?: number;
  datePassage: string;
  amountHT?: number;
  tvaRate?: number;
  tvaAmount?: number;
  amountTTC: number;
  gareEntree?: string;
  gareSortie?: string;
  receiptNumber?: string;
  societeAutoroute?: string;
  notes?: string;
}

export interface PeageResponse {
  id: number;
  reference: string;
  vehiculeId: number;
  vehiculeImmatriculation: string;
  chauffeurId?: number;
  chauffeurNom?: string;
  missionId?: number;
  missionReference?: string;
  datePassage: string;
  amountHT?: number;
  tvaRate?: number;
  tvaAmount?: number;
  amountTTC: number;
  gareEntree?: string;
  gareSortie?: string;
  receiptNumber?: string;
  societeAutoroute?: string;
  notes?: string;
  proofUrl?: string;
  createdAt?: string;
}
