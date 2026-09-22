export type CategorieDepense =
  | 'HEBERGEMENT'
  | 'REPAS'
  | 'TELEPHONE'
  | 'EQUIPEMENT'
  | 'STATIONNEMENT'
  | 'REPARATION_URGENTE'
  | 'AUTRE';

export const CATEGORIES_DEPENSE: { value: CategorieDepense; label: string }[] = [
  { value: 'HEBERGEMENT',       label: 'Hébergement' },
  { value: 'REPAS',             label: 'Repas' },
  { value: 'TELEPHONE',         label: 'Téléphone' },
  { value: 'EQUIPEMENT',        label: 'Équipement' },
  { value: 'STATIONNEMENT',     label: 'Stationnement' },
  { value: 'REPARATION_URGENTE',label: 'Réparation urgente' },
  { value: 'AUTRE',             label: 'Autre' },
];

export function categorieLabel(cat: CategorieDepense | string | undefined): string {
  return CATEGORIES_DEPENSE.find(c => c.value === cat)?.label ?? (cat ?? '—');
}

export interface DepenseDiverseRequest {
  chauffeurId: number;
  vehiculeId?: number | null;
  dateDepense: string;
  categorie: CategorieDepense;
  description?: string;
  amountTTC: number;
  receiptNumber?: string;
  notes?: string;
}

export interface DepenseDiverseResponse {
  id: number;
  reference: string;
  chauffeurId: number;
  chauffeurNom?: string;
  vehiculeId?: number;
  vehiculeImmatriculation?: string;
  dateDepense: string;
  categorie: CategorieDepense;
  description?: string;
  amountTTC: number;
  receiptNumber?: string;
  notes?: string;
  proofUrl?: string;
  createdAt?: string;
}

export interface DepenseDiverseSummaryResponse {
  totalAmountTTC: number;
  totalCount: number;
}
