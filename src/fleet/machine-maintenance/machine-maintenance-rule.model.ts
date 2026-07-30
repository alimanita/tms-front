export type TypeActionMaintenance =
  | 'LUBRIFICATION'
  | 'VIDANGE'
  | 'VERIFICATION_NIVEAU'
  | 'VERIFICATION_TENSION'
  | 'SERRAGE'
  | 'NETTOYAGE'
  | 'REMPLACEMENT'
  | 'AUTRE';

export interface MachineMaintenanceRuleRequest {
  machineId: number;
  code?: string;
  description: string;
  typeAction: TypeActionMaintenance;
  intervalleHeures?: number;
  intervalleJours?: number;
  consommable?: string;
  quantite?: number;
  uniteQuantite?: string;
  dernieresHeuresEffectuees?: number;
  derniereDateEffectuee?: string;
  actif?: boolean;
}

export interface MachineMaintenanceRuleResponse {
  id: number;
  machineId: number;
  machineReference: string;
  machineNom: string;
  code?: string;
  description: string;
  typeAction: TypeActionMaintenance;
  intervalleHeures?: number;
  intervalleJours?: number;
  consommable?: string;
  quantite?: number;
  uniteQuantite?: string;
  dernieresHeuresEffectuees?: number;
  derniereDateEffectuee?: string;
  prochaineEcheanceProche?: boolean;
  heuresRestantes?: number;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}