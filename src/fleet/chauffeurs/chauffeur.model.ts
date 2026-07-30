export interface ChauffeurResponse {
  id: number;
  nom: string;
  prenom: string;
  cin?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  dateEmbauche?: string;
  statut: string;
  numeroPermis?: string;
  categoriesPermis?: string;
  dateDelivrancePermis?: string;
  dateExpirationPermis?: string;
  dateExpirationVisiteMedicale?: string;
  totalKilometres?: number;
  nombreIncidents?: number;
  notes?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
  idUtilisateur?: number | null;
  utilisateurEmail?: string | null;
}

export interface ChauffeurRequest {
  nom: string;
  prenom: string;
  cin?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  dateEmbauche?: string;
  statut?: string;
  numeroPermis?: string;
  categoriesPermis?: string;
  dateDelivrancePermis?: string;
  dateExpirationPermis?: string;
  dateExpirationVisiteMedicale?: string;
  totalKilometres?: number;
  nombreIncidents?: number;
  notes?: string;
  actif?: boolean;
  idUtilisateur?: number | null;
}