export type TypeEntiteOT = 'VEHICLE' | 'MACHINE';
export type TypeOrdreOT = 'PREVENTIVE' | 'CORRECTIVE';
export type PrioriteOT = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type StatutOT = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface TypeMaintenanceOption {
  value: string;
  label: string;
  categorie: 'PREVENTIVE' | 'CORRECTIVE';
}

// Doit rester synchronisé avec l'enum Java TypeMaintenance
export const TYPES_MAINTENANCE: TypeMaintenanceOption[] = [

  { value: 'VIDANGE',              label: 'Vidange huile moteur',              categorie: 'PREVENTIVE' },
  { value: 'FILTRE_AIR',           label: 'Remplacement filtre à air',         categorie: 'PREVENTIVE' },
  { value: 'FILTRE_CARBURANT',     label: 'Remplacement filtre carburant',     categorie: 'PREVENTIVE' },
  { value: 'FILTRE_HUILE',         label: 'Remplacement filtre à huile',       categorie: 'PREVENTIVE' },
  { value: 'COURROIE_DISTRIBUTION',label: 'Remplacement courroie de distribution', categorie: 'PREVENTIVE' },
  { value: 'BOUGIES',              label: 'Remplacement bougies',              categorie: 'PREVENTIVE' },
  { value: 'FREINS',               label: 'Révision freins',                   categorie: 'PREVENTIVE' },
  { value: 'PNEUS_ROTATION',       label: 'Rotation des pneus',                categorie: 'PREVENTIVE' },
  { value: 'REVISION_GENERALE',    label: 'Révision générale',                 categorie: 'PREVENTIVE' },
  { value: 'GRAISSAGE',            label: 'Graissage / lubrification',         categorie: 'PREVENTIVE' },
  { value: 'PANNE_MOTEUR',         label: 'Réparation moteur',                 categorie: 'CORRECTIVE' },
  { value: 'PANNE_ELECTRICITE',    label: 'Réparation électrique',             categorie: 'CORRECTIVE' },
  { value: 'PANNE_FREINAGE',       label: 'Réparation système de freinage',    categorie: 'CORRECTIVE' },
  { value: 'PANNE_TRANSMISSION',   label: 'Réparation transmission',           categorie: 'CORRECTIVE' },
  { value: 'PANNE_SUSPENSION',     label: 'Réparation suspension',             categorie: 'CORRECTIVE' },
  { value: 'ACCIDENT',             label: 'Réparation suite accident',         categorie: 'CORRECTIVE' },
  { value: 'AUTRE',                label: 'Autre intervention',                categorie: 'CORRECTIVE' },
];

export interface OrdreTravailRequest {

  entityType: TypeEntiteOT;
  entityId: number;
  typeMaintenance: string;
  planMaintenanceId?: number;
  orderType: TypeOrdreOT;
  priority?: PrioriteOT;
  description?: string;
  reportedBy?: number;
  reportedDate?: string;      // yyyy-MM-dd
  scheduledDate?: string;     // yyyy-MM-dd
  mileageAtOrder?: number;
  hoursAtOrder?: number;
  technicianId?: number;
  workshop?: string;
  isExternal?: boolean;
  externalProvider?: string;
  estimatedCost?: number;
  notes?: string;
}

export interface OTPieceRechangeRequest {
  pieceRechangeId: number;
  quantityPlanned: number;
  quantityUsed?: number;
}

export interface OTPieceRechangeResponse {
  id: number;
  pieceRechangeId: number;
  pieceReference: string;
  pieceName: string;
  quantityPlanned: number;
  quantityUsed?: number;
  unitCost: number;
  totalCost: number;
}

export interface OTMainOeuvreRequest {
  technicianName: string;
  isExternal?: boolean;
  hoursPlanned?: number;
  hoursActual?: number;
  hourlyRate?: number;
}

export interface OTMainOeuvreResponse {
  id: number;
  technicianName: string;
  isExternal?: boolean;
  hoursPlanned?: number;
  hoursActual?: number;
  hourlyRate?: number;
  totalCost: number;
}

export interface OrdreTravailResponse {
  id: number;
  reference: string;
  entityType: TypeEntiteOT;
  entityId: number;
  entityRef?: string;
  typeMaintenance: string;
  typeMaintenanceLabel?: string;
  planMaintenanceId?: number;
  typeOrdre: TypeOrdreOT;
  priorite: PrioriteOT;
  statut: StatutOT;
  description?: string;
  reportedBy?: number;
  reportedDate?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  mileageAtOrder?: number;
  hoursAtOrder?: number;
  technicianId?: number;
  workshop?: string;
  isExternal?: boolean;
  externalProvider?: string;
  estimatedCost?: number;
  actualLaborCost?: number;
  actualPartsCost?: number;
  actualTotalCost?: number;
  downtimeHours?: number;
  notes?: string;
  pieces: OTPieceRechangeResponse[];
  mainOeuvres: OTMainOeuvreResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Pièces de rechange (stock) ─────────────────────────────────
export interface PieceRechangeRequest {
  reference: string;
  name: string;
  brand?: string;
  unit?: string;
  unitCost?: number;
  stockQty?: number;
  minStockQty?: number;
  stockItemId?: number;
  location?: string;
}

export interface PieceRechangeResponse {
  id: number;
  reference: string;
  name: string;
  brand?: string;
  unit?: string;
  unitCost?: number;
  stockQty: number;
  minStockQty: number;
  stockItemId?: number;
  location?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Stats Syage (changement de lames) ─────────────────────────

/** Réponse de l'API stats-syage : hauteur totale syée depuis un changement de lames. */
export interface StatsSyageResponse {
  /** ID de l'OT de changement de lames (null = aucun changement enregistré) */
  otId: number | null;
  /** Référence de l'OT */
  referenceOT: string | null;
  machineId: number;
  machineNom: string;
  /** Date ISO du changement de lames */
  dateChangementLames: string | null;
  /** Hauteur totale en cm */
  hauteurTotaleCm: number;
  /** Hauteur totale en mètres */
  hauteurTotaleMetres: number;
  nombreBlocsSyes: number;
  nombreOFsSyage: number;
}