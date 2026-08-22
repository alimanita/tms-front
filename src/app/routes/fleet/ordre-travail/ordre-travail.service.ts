import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  OrdreTravailRequest, OrdreTravailResponse,
  OTPieceRechangeRequest, OTMainOeuvreRequest,
  TypeEntiteOT, PageResponse,
  PieceRechangeRequest, PieceRechangeResponse,
  StatsSyageResponse
} from './ordre-travail.model';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdreTravailService {
  private readonly base = `${environment.baseUrl}/fleet/ordres-travail`;
  private readonly basePieces = `${environment.baseUrl}/fleet/pieces-rechange`;

  constructor(private http: HttpClient) {}

findAll(
  pageIndex: number,
  pageSize: number,
  filters?: { statut?: string; entityType?: string; search?: string; dateDebut?: string; dateFin?: string }
): Observable<PageResponse<OrdreTravailResponse>> {
  let params = new HttpParams().set('page', pageIndex).set('size', pageSize);
  if (filters?.statut)     params = params.set('statut', filters.statut);
  if (filters?.entityType) params = params.set('entityType', filters.entityType);
  if (filters?.search)     params = params.set('search', filters.search);
  if (filters?.dateDebut)  params = params.set('dateDebut', filters.dateDebut);
  if (filters?.dateFin)    params = params.set('dateFin', filters.dateFin);
  return this.http.get<PageResponse<OrdreTravailResponse>>(this.base, { params });
}

  findById(id: number): Observable<OrdreTravailResponse> {
    return this.http.get<OrdreTravailResponse>(`${this.base}/${id}`);
  }

  create(request: OrdreTravailRequest): Observable<OrdreTravailResponse> {
    return this.http.post<OrdreTravailResponse>(this.base, request);
  }

  update(id: number, request: OrdreTravailRequest): Observable<OrdreTravailResponse> {
    return this.http.put<OrdreTravailResponse>(`${this.base}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  findByEntite(entityType: TypeEntiteOT, entityId: number): Observable<OrdreTravailResponse[]> {
    return this.http.get<OrdreTravailResponse[]>(`${this.base}/entite/${entityType}/${entityId}`);
  }

  demarrer(id: number): Observable<OrdreTravailResponse> {
    return this.http.patch<OrdreTravailResponse>(`${this.base}/${id}/demarrer`, {});
  }

  cloturer(id: number): Observable<OrdreTravailResponse> {
    return this.http.patch<OrdreTravailResponse>(`${this.base}/${id}/cloturer`, {});
  }

  annuler(id: number): Observable<OrdreTravailResponse> {
    return this.http.patch<OrdreTravailResponse>(`${this.base}/${id}/annuler`, {});
  }

  addPiece(id: number, request: OTPieceRechangeRequest): Observable<OrdreTravailResponse> {
    return this.http.post<OrdreTravailResponse>(`${this.base}/${id}/pieces`, request);
  }

  removePiece(id: number, pieceOtId: number): Observable<OrdreTravailResponse> {
    return this.http.delete<OrdreTravailResponse>(`${this.base}/${id}/pieces/${pieceOtId}`);
  }

  addMainOeuvre(id: number, request: OTMainOeuvreRequest): Observable<OrdreTravailResponse> {
    return this.http.post<OrdreTravailResponse>(`${this.base}/${id}/main-oeuvre`, request);
  }

  removeMainOeuvre(id: number, moId: number): Observable<OrdreTravailResponse> {
    return this.http.delete<OrdreTravailResponse>(`${this.base}/${id}/main-oeuvre/${moId}`);
  }

  // ── Pièces de rechange (stock) ─────────────────────────────────
  findAllPieces(pageIndex = 0, pageSize = 50): Observable<PageResponse<PieceRechangeResponse>> {
    const params = new HttpParams().set('page', pageIndex).set('size', pageSize);
    return this.http.get<PageResponse<PieceRechangeResponse>>(this.basePieces, { params });
  }

  findStockFaible(): Observable<PieceRechangeResponse[]> {
    return this.http.get<PieceRechangeResponse[]>(`${this.basePieces}/stock-faible`);
  }

  savePiece(request: PieceRechangeRequest, id?: number): Observable<PieceRechangeResponse> {
    return id
      ? this.http.put<PieceRechangeResponse>(`${this.basePieces}/${id}`, request)
      : this.http.post<PieceRechangeResponse>(this.basePieces, request);
  }

  deletePiece(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basePieces}/${id}`);
  }

  uploadPieceProofFile(id: number, file: File): Observable<PieceRechangeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PieceRechangeResponse>(`${this.basePieces}/${id}/proof`, formData);
  }

  getPieceProofFile(id: number): Observable<import('@angular/common/http').HttpResponse<Blob>> {
    return this.http.get(`${this.basePieces}/${id}/proof`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  extractPieceData(proof: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', proof);
    return this.http.post<any>(`${this.basePieces}/extract`, formData);
  }

  // ── Statistiques Syage ─────────────────────────────────
  getStatsSyageMachine(machineId: number, idEntreprise: number): Observable<StatsSyageResponse> {
    const params = new HttpParams().set('idEntreprise', idEntreprise.toString());
    return this.http.get<StatsSyageResponse>(`${this.base}/machine/${machineId}/stats-syage`, { params });
  }

  getHistoriqueLamesMachine(machineId: number, idEntreprise: number): Observable<StatsSyageResponse[]> {
    const params = new HttpParams().set('idEntreprise', idEntreprise.toString());
    return this.http.get<StatsSyageResponse[]>(`${this.base}/machine/${machineId}/historique-lames`, { params });
  }
}