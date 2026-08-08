import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  MissionResponse, MissionRequest, MissionRetourRequest,
  DepenseMissionRequest, DepenseMissionResponse, PageResponse
} from './mission.model';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly baseUrl = `${environment.baseUrl}/fleet/missions`;
  // ⚠️ adapter le chemin exact selon votre config d'environment (context-path différent de /gestiondestock/v1)

  constructor(private http: HttpClient) {}

findAll(pageIndex: number, pageSize: number) {
  return this.http.get<PageResponse<MissionResponse>>(
    `${this.baseUrl}?page=${pageIndex}&size=${pageSize}`,
    { headers: { 'Cache-Control': 'no-cache' } }
  );
}

  findById(id: number): Observable<MissionResponse> {
    return this.http.get<MissionResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: MissionRequest): Observable<MissionResponse> {
    return this.http.post<MissionResponse>(this.baseUrl, request);
  }

  update(id: number, request: MissionRequest): Observable<MissionResponse> {
    return this.http.put<MissionResponse>(`${this.baseUrl}/${id}`, request);
  }

  soumettre(id: number): Observable<MissionResponse> {
    return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/soumettre`, {});
  }
findMesMissions(): Observable<MissionResponse[]> {
  return this.http.get<MissionResponse[]>(`${this.baseUrl}/mes-missions`);
}
  approuver(id: number): Observable<MissionResponse> {
    return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/approuver`, {});
  }

  rejeter(id: number, motif: string): Observable<MissionResponse> {
    const params = new HttpParams().set('motif', motif);
    return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/rejeter`, {}, { params });
  }


demarrer(id: number, mileageAtDeparture?: number) {
  let params = new HttpParams();
  if (mileageAtDeparture != null) {
    params = params.set('mileageAtDeparture', mileageAtDeparture.toString());
  }
  return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/demarrer`, {}, { params });
}
  cloturer(id: number, mileageAtReturn?: number): Observable<MissionResponse> {
    let params = new HttpParams();
    if (mileageAtReturn != null) {
      params = params.set('mileageAtReturn', mileageAtReturn.toString());
    }
    return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/cloturer`, {}, { params });
  }

  annuler(id: number, motif: string): Observable<MissionResponse> {
    const params = new HttpParams().set('motif', motif);
    return this.http.patch<MissionResponse>(`${this.baseUrl}/${id}/annuler`, {}, { params });
  }

  addDepense(id: number, request: DepenseMissionRequest): Observable<DepenseMissionResponse> {
    return this.http.post<DepenseMissionResponse>(`${this.baseUrl}/${id}/depenses`, request);
  }

  findDepenses(id: number): Observable<DepenseMissionResponse[]> {
    return this.http.get<DepenseMissionResponse[]>(`${this.baseUrl}/${id}/depenses`);
  }

  removeDepense(id: number, depenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/depenses/${depenseId}`);
  }

  findByVehicule(vehiculeId: number): Observable<MissionResponse[]> {
    return this.http.get<MissionResponse[]>(`${this.baseUrl}/vehicule/${vehiculeId}`);
  }

  findByChauffeur(chauffeurId: number): Observable<MissionResponse[]> {
    return this.http.get<MissionResponse[]>(`${this.baseUrl}/chauffeur/${chauffeurId}`);
  }

  findEnCours(): Observable<MissionResponse[]> {
    return this.http.get<MissionResponse[]>(`${this.baseUrl}/en-cours`);
  }

  
}