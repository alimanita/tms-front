export interface SocietePartenaireResponse {
  id: number;
  nom: string;
  matriculeFiscal?: string;
  adresse?: string;
  contact?: string;
  telephone?: string;
  email?: string;
  iban?: string;
  statut: string;
  tauxCommissionDefaut?: number;
}

export interface SocietePartenaireRequest {
  nom: string;
  matriculeFiscal?: string;
  adresse?: string;
  contact?: string;
  telephone?: string;
  email?: string;
  iban?: string;
  statut?: string;
  tauxCommissionDefaut?: number;
}
