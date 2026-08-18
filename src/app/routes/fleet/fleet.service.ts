

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UtilisateurLite } from './chauffeurs/chauffeur-form/chauffeur-form.component';
import { ChauffeurResponse } from './chauffeurs/chauffeur.model';
import { environment } from 'environments/environment';

// ── DTOs Rapports Entretiens & Carburant ──────────────────────────────────────

export interface MaintenanceMensuelleDto {
  annee: number;
  mois: number;
  moisLabel: string;
  coutMainOeuvre: number;
  coutPieces: number;
  coutTotal: number;
  nombreOT: number;
}

export interface MaintenanceAnnuelleDto {
  annee: number;
  coutMainOeuvre: number;
  coutPieces: number;
  coutTotal: number;
  nombreOT: number;
}

export interface MaintenanceDetailDto {
  id: number;
  reference: string;
  entityRef: string;
  entityType: 'VEHICLE' | 'MACHINE';
  typeMaintenance: string;
  priorite: string;
  statut: string;
  scheduledDate: string;
  completedAt: string;
  coutMainOeuvre: number;
  coutPieces: number;
  coutTotal: number;
}

export interface SyntheseEntretiensDto {
  coutTotalMaintenance: number;
  coutMainOeuvreTotale: number;
  coutPiecesTotales: number;
  coutTotalCarburant: number;
  coutGlobal: number;
  nombreOT: number;
  nombrePleins: number;
  litresTotaux: number;
}

export interface CarburantMensuelDto {
  annee: number;
  mois: number;
  moisLabel: string;
  litresTotaux: number;
  coutTotal: number;
  nombrePleins: number;
  consommationMoyenne: number;
}

export interface CarburantAnnuelDto {
  annee: number;
  litresTotaux: number;
  coutTotal: number;
  nombrePleins: number;
}





export interface VehiculeRequest {
  reference?: string; 
  immatriculation: string;
  marque?: string;
  modele?: string;
  annee?: number;
  typeCarburant?: string;
  statut?: string;
  kilometrageActuel?: number;
  capaciteReservoir?: number;
}

export interface VehiculeResponse {
  id: number;
  reference?: string;
  immatriculation: string;
  marque?: string;
  modele?: string;
  annee?: number;
  typeCarburant?: string;
  statut?: string;
  kilometrageActuel?: number;
  capaciteReservoir?: number;
  actif?: boolean;
}

export interface PleinCarburantRequest {
  vehiculeId: number;
  chauffeurId?: number;
  fillingDate?: string;
  fuelType: string;
  quantityLiters: number;
  pricePerLiter: number;
  mileageBefore?: number;
  mileageAfter?: number;
  isFullTank?: boolean;
  receiptNumber?: string;
  notes?: string;
  amountHT?: number;
  amountTTC?: number;
  tvaRate?: number;
  tvaAmount?: number;
  isTvaRecoverable?: boolean;
  recoverableTvaAmount?: number;
  acciseAmount?: number;
}

export interface PleinCarburantResponse {
  id: number;
  reference?: string;
  vehiculeId?: number;
  vehiculeRef?: string;
  vehiculeImmatriculation?: string;
  chauffeurId?: number;
  chauffeurNom?: string;
  fillingDate?: string;
  fuelType?: string;
  quantityLiters?: number;
  pricePerLiter?: number;
  mileageBefore?: number;
  mileageAfter?: number;
  consumptionRate?: number;
  isFullTank?: boolean;
  receiptNumber?: string;
  proofUrl?: string;
  notes?: string;
  totalAmount?: number;
  amountHT?: number;
  amountTTC?: number;
  tvaRate?: number;
  tvaAmount?: number;
  isTvaRecoverable?: boolean;
  recoverableTvaAmount?: number;
  acciseAmount?: number;
}

export interface DashboardOverviewResponse {
  totalVehicules?: number;
  vehiculesDisponibles?: number;
  vehiculesEnService?: number;
  vehiculesHorsService?: number;
  coutCarburantMois?: number;
  nombrePleinsMois?: number;
}


export interface MachineRequest {
  reference?: string;
  numeroSerie: string;
  nom: string;
  marque?: string;
  modele?: string;
  categorie?: string;
  dateAchat?: string;
  prixAchat?: number;
  unitesPuissance?: string;
  valeurPuissance?: number;
  heuresInitiales?: number;
  heuresActuelles?: number;
  localisation?: string;
  statut?: string;
  tauxDisponibilite?: number;
  notes?: string;
  actif?: boolean;
}

export interface MachineResponse {
  id: number;
  reference?: string;
  numeroSerie?: string;
  nom: string;
  marque?: string;
  modele?: string;
  categorie?: string;
  dateAchat?: string;
  prixAchat?: number;
  unitesPuissance?: string;
  valeurPuissance?: number;
  heuresInitiales?: number;
  heuresActuelles?: number;
  localisation?: string;
  statut?: string;
  tauxDisponibilite?: number;
  notes?: string;
  actif?: boolean;
}

export interface ChauffeurRequest {
  reference?: string;
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
  notes?: string;
  actif?: boolean;
}



export interface NotificationFlotteResponse {
  id: number;
  type?: string;
  severity?: string;
  entityType?: string;
  entityId?: number;
  entityRef?: string;
  title: string;
  message: string;
  dueDate?: string;
  isRead?: boolean;
  isDismissed?: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface UpdateHeuresResponse {
  id: number;
  nom: string;
  anciennesHeures: number;
  heuresActuelles: number;
  updatedAt: string;
}
// ── Pneus ──────────────────────────────────────────────
export interface PneuRequest {
  serialNumber?: string;
  brand?: string;
  model?: string;
  size?: string;
  type?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  maxKm?: number;
  status?: string;
  isActive?: boolean;
}

export interface PneuResponse {
  id: number;
  serialNumber?: string;
  brand?: string;
  model?: string;
  size?: string;
  type?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  maxKm?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

// ── Affectation Pneus ──────────────────────────────────
export interface AffectationPneuRequest {
  pneuId: number;
  vehiculeId: number;
  position: string;
  mountDate: string;
  mountMileage: number;
  unmountDate?: string;
  unmountMileage?: number;
  reasonUnmount?: string;
  notes?: string;
}

export interface AffectationPneuResponse {
  id: number;
  pneuId: number;
  pneuSerialNumber?: string;
  vehiculeId: number;
  vehiculeImmatriculation?: string;
  position: string;
  mountDate: string;
  mountMileage: number;
  unmountDate?: string;
  unmountMileage?: number;
  reasonUnmount?: string;
  notes?: string;
  kmUsed?: number;
  createdAt?: string;
}

// ── Changement d'Huile ─────────────────────────────────
export interface ChangementHuileRequest {
  reference?: string;
  entityType: 'VEHICLE' | 'MACHINE';
  entityId: number;
  typeHuile: string;
  changeDate: string;
  mileageAtChange?: number;
  hoursAtChange?: number;
  quantityLiters: number;
  unitCost?: number;
  totalCost?: number;
  nextChangeKm?: number;
  nextChangeHours?: number;
  nextChangeDate?: string;
  performedBy?: string;
  notes?: string;
}

export interface ChangementHuileResponse {
  id: number;
  reference?: string;
  entityType: 'VEHICLE' | 'MACHINE';
  entityId: number;
  entityRef?: string;
  typeHuile: string;
  changeDate: string;
  mileageAtChange?: number;
  hoursAtChange?: number;
  quantityLiters: number;
  unitCost?: number;
  totalCost?: number;
  nextChangeKm?: number;
  nextChangeHours?: number;
  nextChangeDate?: string;
  performedBy?: string;
  notes?: string;
  createdAt?: string;
}

// ── Document Flotte ────────────────────────────────────
export interface DocumentFlotteRequest {
  typeDocument: string;
  entityType: 'VEHICLE' | 'MACHINE' | 'DRIVER';
  entityId: number;
  referenceNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  amount?: number;
  status?: string;
  notes?: string;
  filePath?: string;
  fileName?: string;
}

export interface DocumentFlotteResponse {
  id: number;
  typeDocument: string;
  entityType: 'VEHICLE' | 'MACHINE' | 'DRIVER';
  entityId: number;
  entityRef?: string;
  referenceNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  amount?: number;
  filePath?: string;
  fileName?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FleetService {
  private base = `${environment.baseUrl}/fleet`;

  constructor(private http: HttpClient) {}
  // Véhicules
  getVehicules(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/vehicules`, { params });
  }

  getVehiculeById(id: number): Observable<VehiculeResponse> {
    return this.http.get<VehiculeResponse>(`${this.base}/vehicules/${id}`);
  }

  getVehiculesDisponibles(): Observable<VehiculeResponse[]> {
    return this.http.get<VehiculeResponse[]>(`${this.base}/vehicules/disponibles`);
  }

  saveVehicule(request: VehiculeRequest, id?: number): Observable<VehiculeResponse> {
    return id
      ? this.http.put<VehiculeResponse>(`${this.base}/vehicules/${id}`, request)
      : this.http.post<VehiculeResponse>(`${this.base}/vehicules`, request);
  }

  updateStatut(id: number, statut: string): Observable<VehiculeResponse> {
    return this.http.patch<VehiculeResponse>(
      `${this.base}/vehicules/${id}/statut`, null, { params: { statut } }
    );
  }
getMonChauffeur(): Observable<ChauffeurResponse> {
  return this.http.get<ChauffeurResponse>(`${this.base}/chauffeurs/me`);
}
  // Pleins carburant
  getPleins(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/pleins-carburant`, { params });
  }

  getPleinById(id: number): Observable<PleinCarburantResponse> {
    return this.http.get<PleinCarburantResponse>(`${this.base}/pleins-carburant/${id}`);
  }

  getPleinsByVehicule(vehiculeId: number): Observable<PleinCarburantResponse[]> {
    return this.http.get<PleinCarburantResponse[]>(
      `${this.base}/pleins-carburant/vehicule/${vehiculeId}`
    );
  }

  getPleinsByChauffeur(chauffeurId: number): Observable<PleinCarburantResponse[]> {
    return this.http.get<PleinCarburantResponse[]>(
      `${this.base}/pleins-carburant/chauffeur/${chauffeurId}`
    );
  }

  // savePlein(request: PleinCarburantRequest): Observable<PleinCarburantResponse> {
  //   return this.http.post<PleinCarburantResponse>(`${this.base}/pleins-carburant`, request);
  // }

  deletePlein(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pleins-carburant/${id}`);
  }

  // Péages (Tolls)
  getTolls(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/missions/depenses/tolls`, { params });
  }

  getTollProofFile(missionId: number, depenseId: number) {
    return this.http.get(
      `${this.base}/missions/${missionId}/depenses/${depenseId}/receipt`,
      { responseType: 'blob', observe: 'response' }
    );
  }

  // Dashboard
  getDashboardOverview(): Observable<DashboardOverviewResponse> {
    return this.http.get<DashboardOverviewResponse>(`${this.base}/dashboard/overview`);
  }

  getCoutsMensuels(mois = 12): Observable<any> {
    return this.http.get(`${this.base}/dashboard/couts-mensuels`, { params: { mois } });
  }
getUtilisateursByRole(role: string, idEntreprise?: number): Observable<UtilisateurLite[]> {
  const params: any = { role };
  if (idEntreprise && idEntreprise > 0) {
    params['idEntreprise'] = idEntreprise;
  }
  return this.http.get<UtilisateurLite[]>(
    `${environment.baseUrl}/utilisateurs/by-role`,
    { params }
  );
}
  getConsommationCarburant(mois = 12): Observable<any> {
    return this.http.get(`${this.base}/dashboard/consommation-carburant`, { params: { mois } });
  }

  // Notifications
  // getNotificationsNonLues(): Observable<NotificationFlotteResponse[]> {
  //   return this.http.get<NotificationFlotteResponse[]>(`${this.base}/notifications/non-lues`);
  // }

  // countNonLues(): Observable<number> {
  //   return this.http.get<number>(`${this.base}/notifications/count-non-lues`);
  // }

  // marquerLue(id: number): Observable<NotificationFlotteResponse> {
  //   return this.http.patch<NotificationFlotteResponse>(
  //     `${this.base}/notifications/${id}/lire`, null
  //   );
  // }

  // marquerToutesLues(): Observable<void> {
  //   return this.http.patch<void>(`${this.base}/notifications/lire-toutes`, null);
  // }

  // Machines
  getMachines(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/machines`, { params });
  }

  getMachineById(id: number): Observable<MachineResponse> {
    return this.http.get<MachineResponse>(`${this.base}/machines/${id}`);
  }

  saveMachine(request: MachineRequest, id?: number): Observable<MachineResponse> {
    return id
      ? this.http.put<MachineResponse>(`${this.base}/machines/${id}`, request)
      : this.http.post<MachineResponse>(`${this.base}/machines`, request);
  }

  updateMachineStatut(id: number, statut: string): Observable<MachineResponse> {
    return this.http.patch<MachineResponse>(
      `${this.base}/machines/${id}/statut`, null, { params: { statut } }
    );
  }

  toggleMachineActif(id: number): Observable<MachineResponse> {
    return this.http.patch<MachineResponse>(`${this.base}/machines/${id}/toggle-actif`, null);
  }
toggleVehicleActif(id: number): Observable<VehiculeResponse> {
  return this.http.patch<VehiculeResponse>(
    `${this.base}/vehicules/${id}/toggle-actif`,
    null
  );
}
  // Chauffeurs
  getChauffeurs(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/chauffeurs`, { params });
  }

  getChauffeurById(id: number): Observable<ChauffeurResponse> {
    return this.http.get<ChauffeurResponse>(`${this.base}/chauffeurs/${id}`);
  }

  getChauffeursDisponibles(): Observable<ChauffeurResponse[]> {
    return this.http.get<ChauffeurResponse[]>(`${this.base}/chauffeurs/disponibles`);
  }

  saveChauffeur(request: ChauffeurRequest, id?: number): Observable<ChauffeurResponse> {
    return id
      ? this.http.put<ChauffeurResponse>(`${this.base}/chauffeurs/${id}`, request)
      : this.http.post<ChauffeurResponse>(`${this.base}/chauffeurs`, request);
  }

  toggleChauffeurActif(id: number): Observable<ChauffeurResponse> {
    return this.http.patch<ChauffeurResponse>(`${this.base}/chauffeurs/${id}/toggle-actif`, null);
  }


  // Notifications
  getNotifications(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/notifications`, { params });
  }

  getNotificationsNonLues(): Observable<NotificationFlotteResponse[]> {
    return this.http.get<NotificationFlotteResponse[]>(`${this.base}/notifications/non-lues`);
  }

  getNotificationsCritiques(): Observable<NotificationFlotteResponse[]> {
    return this.http.get<NotificationFlotteResponse[]>(`${this.base}/notifications/critiques`);
  }

  marquerLue(id: number): Observable<NotificationFlotteResponse> {
    return this.http.patch<NotificationFlotteResponse>(
      `${this.base}/notifications/${id}/lire`, null
    );
  }

  marquerToutesLues(): Observable<void> {
    return this.http.patch<void>(`${this.base}/notifications/lire-toutes`, null);
  }

  ignorerNotification(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/notifications/${id}/ignorer`, null);
  }

  countNonLues(): Observable<number> {
    return this.http.get<number>(`${this.base}/notifications/count-non-lues`);
  }

updateHeuresActuelles(id: number, heures: number): Observable<UpdateHeuresResponse> {
  return this.http.patch<UpdateHeuresResponse>(`${this.base}/machines/${id}/heures`, { heuresActuelles: heures });
}

  // ── Rapports Entretiens & Carburant ──────────────────────────────────────────

  getRapportEntretiensMensuel(params: {
    entityType?: string; debut?: string; fin?: string;
  }): Observable<MaintenanceMensuelleDto[]> {
    let p = new HttpParams();
    if (params.entityType) p = p.set('entityType', params.entityType);
    if (params.debut)      p = p.set('debut', params.debut);
    if (params.fin)        p = p.set('fin', params.fin);
    return this.http.get<MaintenanceMensuelleDto[]>(`${this.base}/rapports/entretiens/mensuel`, { params: p });
  }

  getRapportEntretiensAnnuel(params: {
    entityType?: string; anDebut?: number; anFin?: number;
  }): Observable<MaintenanceAnnuelleDto[]> {
    let p = new HttpParams();
    if (params.entityType) p = p.set('entityType', params.entityType);
    if (params.anDebut)    p = p.set('anDebut', params.anDebut);
    if (params.anFin)      p = p.set('anFin', params.anFin);
    return this.http.get<MaintenanceAnnuelleDto[]>(`${this.base}/rapports/entretiens/annuel`, { params: p });
  }

  getRapportEntretiensDetail(params: {
    entityType?: string; debut?: string; fin?: string;
  }): Observable<MaintenanceDetailDto[]> {
    let p = new HttpParams();
    if (params.entityType) p = p.set('entityType', params.entityType);
    if (params.debut)      p = p.set('debut', params.debut);
    if (params.fin)        p = p.set('fin', params.fin);
    return this.http.get<MaintenanceDetailDto[]>(`${this.base}/rapports/entretiens/detail`, { params: p });
  }

  getRapportEntretiensSynthese(params: {
    entityType?: string; debut?: string; fin?: string;
  }): Observable<SyntheseEntretiensDto> {
    let p = new HttpParams();
    if (params.entityType) p = p.set('entityType', params.entityType);
    if (params.debut)      p = p.set('debut', params.debut);
    if (params.fin)        p = p.set('fin', params.fin);
    return this.http.get<SyntheseEntretiensDto>(`${this.base}/rapports/entretiens/synthese`, { params: p });
  }

  getRapportCarburantMensuel(params: {
    vehiculeId?: number; debut?: string; fin?: string;
  }): Observable<CarburantMensuelDto[]> {
    let p = new HttpParams();
    if (params.vehiculeId) p = p.set('vehiculeId', params.vehiculeId);
    if (params.debut)      p = p.set('debut', params.debut);
    if (params.fin)        p = p.set('fin', params.fin);
    return this.http.get<CarburantMensuelDto[]>(`${this.base}/rapports/carburant/mensuel`, { params: p });
  }

  getRapportCarburantAnnuel(params: {
    vehiculeId?: number; anDebut?: number; anFin?: number;
  }): Observable<CarburantAnnuelDto[]> {
    let p = new HttpParams();
    if (params.vehiculeId) p = p.set('vehiculeId', params.vehiculeId);
    if (params.anDebut)    p = p.set('anDebut', params.anDebut);
    if (params.anFin)      p = p.set('anFin', params.anFin);
    return this.http.get<CarburantAnnuelDto[]>(`${this.base}/rapports/carburant/annuel`, { params: p });
  }

savePlein(request: PleinCarburantRequest, proof?: File) {
  const formData = new FormData();
  formData.append(
    'data',
    new Blob([JSON.stringify(request)], { type: 'application/json' })
  );
  if (proof) {
    // Sur mobile (caméra), le nom peut être vide ou "image" — on s'assure qu'il est valide
    const ext = proof.type?.split('/')[1] || 'jpg';
    const safeName = (proof.name && proof.name.length > 0 && proof.name !== 'image' && proof.name !== 'blob')
      ? proof.name
      : `photo_${Date.now()}.${ext}`;
    formData.append('proof', proof, safeName);
  }
  return this.http.post<PleinCarburantResponse>(
    `${this.base}/pleins-carburant`,
    formData
  );
}

getProofFile(pleinId: number) {
  return this.http.get(
    `${this.base}/pleins-carburant/${pleinId}/proof`,
    { responseType: 'blob', observe: 'response' }
  );
}

extractFuelData(proof: File): Observable<any> {
  const formData = new FormData();
  formData.append('proof', proof, proof.name);
  return this.http.post<any>(`${this.base}/pleins-carburant/extract`, formData);
}
  // ── Pneus ─────────────────────────────────────────────
  getPneus(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/pneus`, { params });
  }

  getPneuById(id: number): Observable<PneuResponse> {
    return this.http.get<PneuResponse>(`${this.base}/pneus/${id}`);
  }

  savePneu(request: PneuRequest, id?: number): Observable<PneuResponse> {
    return id
      ? this.http.put<PneuResponse>(`${this.base}/pneus/${id}`, request)
      : this.http.post<PneuResponse>(`${this.base}/pneus`, request);
  }

  togglePneuActif(id: number): Observable<PneuResponse> {
    return this.http.patch<PneuResponse>(`${this.base}/pneus/${id}/toggle-actif`, null);
  }

  // ── Affectations Pneus ────────────────────────────────
  getAffectationsPneus(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/pneus/affectations`, { params });
  }

  getAffectationPneuById(id: number): Observable<AffectationPneuResponse> {
    return this.http.get<AffectationPneuResponse>(`${this.base}/pneus/affectations/${id}`);
  }

  saveAffectationPneu(request: AffectationPneuRequest): Observable<AffectationPneuResponse> {
    return this.http.post<AffectationPneuResponse>(`${this.base}/pneus/affectations`, request);
  }

  unmountPneu(id: number, unmountMileage: number, reasonUnmount: string): Observable<AffectationPneuResponse> {
    let params = new HttpParams()
      .set('unmountMileage', unmountMileage.toString())
      .set('raison', reasonUnmount);
    return this.http.patch<AffectationPneuResponse>(`${this.base}/pneus/affectations/${id}/demonter`, null, { params });
  }

  // ── Changements d'Huile ───────────────────────────────
  getChangementsHuile(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/changements-huile`, { params });
  }

  getChangementHuileById(id: number): Observable<ChangementHuileResponse> {
    return this.http.get<ChangementHuileResponse>(`${this.base}/changements-huile/${id}`);
  }

  saveChangementHuile(request: ChangementHuileRequest, id?: number): Observable<ChangementHuileResponse> {
    return id
      ? this.http.put<ChangementHuileResponse>(`${this.base}/changements-huile/${id}`, request)
      : this.http.post<ChangementHuileResponse>(`${this.base}/changements-huile`, request);
  }

  deleteChangementHuile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/changements-huile/${id}`);
  }

  // ── Documents Flotte ──────────────────────────────────
  getDocumentsFlotte(pageable?: { page?: number; size?: number }): Observable<any> {
    const params: any = { page: pageable?.page ?? 0, size: pageable?.size ?? 50 };
    return this.http.get(`${this.base}/documents`, { params });
  }
getDocumentFile(id: number) {
  return this.http.get(
    `${this.base}/documents/${id}/file`,
    { responseType: 'blob', observe: 'response' }
  );
}
  getDocumentFlotteById(id: number): Observable<DocumentFlotteResponse> {
    return this.http.get<DocumentFlotteResponse>(`${this.base}/documents/${id}`);
  }

  saveDocumentFlotte(request: DocumentFlotteRequest, file?: File, id?: number): Observable<DocumentFlotteResponse> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file, file.name);
    }
    // Note: Assuming backend might need adaptation to handle multipart, sending formData.
    // If backend doesn't support multipart yet, this can be easily adapted later.
    return id
      ? this.http.put<DocumentFlotteResponse>(`${this.base}/documents/${id}`, formData)
      : this.http.post<DocumentFlotteResponse>(`${this.base}/documents`, formData);
  }

  deleteDocumentFlotte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${id}`);
  }
}
