export enum StatutMission {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
export interface MissionResponse {
  id: number;
  reference: string;
  vehiculeId: number;
  vehiculeRef?: string;
  chauffeurId: number;
  chauffeurNom?: string;
  destination?: string;
  motif?: string;
  statut: StatutMission;
  plannedDeparture: string;
  plannedReturn: string;
  actualDeparture?: string;
  actualReturn?: string;
  kilometrageDepart?: number;
  kilometrageRetour?: number;
  totalCost?: number;
  revenue?: number;
  motifRejet?: string;
  motifAnnulation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MissionRequest {
  title: string;
  clientId?: number;
  vehiculeId: number;
  chauffeurId: number;
  departureLocation: string;
  arrivalLocation: string;
  plannedDeparture: string;       // ISO LocalDateTime, ex: "2026-07-10T08:00:00"
  plannedReturn?: string;
  purpose?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
  revenue?: number;
}


export interface MissionRetourRequest {
  kilometrageRetour: number;
  dateRetourEffective?: string;
  totalCost?: number;
}
export interface DepenseMissionResponse {
  id: number;
  libelle: string;
  montant: number;
  categorie?: string;
  dateCreation?: string;
}

export interface DepenseMissionResponse {
  id: number;
  libelle: string;
  montant: number;
  categorie?: string;
  dateCreation?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export enum TypeDepense {
  FUEL = 'FUEL',
  TOLL = 'TOLL',
  MEAL = 'MEAL',
  LODGING = 'LODGING',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export interface DepenseMissionRequest {
  expenseType: TypeDepense;
  montant: number;
  currency?: string;         // défaut 'TND' côté backend si omis
  expenseDate: string;       // ISO LocalDateTime, ex: "2026-07-04T10:00:00"
  description?: string;
  receiptPath?: string;
  isReimbursable?: boolean;
}

export interface DepenseMissionResponse {
  id: number;
  missionId: number;
  expenseType: TypeDepense;
  montant: number;
  currency: string;
  expenseDate: string;
  description?: string;
  receiptPath?: string;
  isReimbursable: boolean;
  createdAt: string;
}