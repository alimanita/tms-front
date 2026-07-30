

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environments/environment';


export interface RoleDashboardStatsDto {
  idEntreprise:       number;
  // Vendeur
  facturesAujourdhui: number;
  blEnAttente:        number;
  facturesImpayees:   number;
  // Comptable
  echeancesMois:      number;
  paiementsEnAttente: number;
  encaisseMois:       number;
  // Manager
  commandesTraitees:  number;
  commandesEnCours:   number;
  // Magasinier
  blDuJour:           number;
  stockCritique:      number;
  // Chauffeur (base)
  mesVehicules:         number;
  vehiculesDisponibles: number;
  missionsEnCours:      number;
  maintenancesAVenir:   number;
  // Chauffeur (étendu)
  missionsTerminees:    number;
  pleinsCeMois:         number;
  coutCarburantMois:    number;
  // Mécanicien (base)
  mesMachines:             number;
  machinesEnPanne:         number;
  ordresTravailEnCours:    number;
  ordresTravailTermines:   number;
  // Mécanicien (étendu)
  machinesOperationnelles: number;
  piecesCritiquesMeca:     number;
  reglesMaintenanceActives:number;
  otPlanifiesMois:         number;
  coutMaintenanceMois:     number;
}

@Injectable({ providedIn: 'root' })
export class RoleStatisticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/statistics/role-dashboard`;

  getRoleDashboardStats(idEntreprise?: number): Observable<RoleDashboardStatsDto> {
    let params = new HttpParams();
    if (idEntreprise) params = params.set('idEntreprise', idEntreprise);
    return this.http.get<RoleDashboardStatsDto>(this.base, { params });
  }
}