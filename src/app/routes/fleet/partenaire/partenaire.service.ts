import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocietePartenaireRequest, SocietePartenaireResponse } from './partenaire.model';

import { environment } from '../../../../environments/environment';
import { PageResponse } from '../mission/mission.model';

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {
  private readonly apiUrl = `${environment.baseUrl}/fleet/partenaires`;

  constructor(private http: HttpClient) {}

  findAll(pageIndex = 0, pageSize = 50): Observable<PageResponse<SocietePartenaireResponse>> {
    return this.http.get<PageResponse<SocietePartenaireResponse>>(`${this.apiUrl}?page=${pageIndex}&size=${pageSize}`);
  }

  findAllActive(): Observable<SocietePartenaireResponse[]> {
    return this.http.get<SocietePartenaireResponse[]>(`${this.apiUrl}/actifs`);
  }

  findById(id: number): Observable<SocietePartenaireResponse> {
    return this.http.get<SocietePartenaireResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: SocietePartenaireRequest): Observable<SocietePartenaireResponse> {
    return this.http.post<SocietePartenaireResponse>(this.apiUrl, request);
  }

  update(id: number, request: SocietePartenaireRequest): Observable<SocietePartenaireResponse> {
    return this.http.put<SocietePartenaireResponse>(`${this.apiUrl}/${id}`, request);
  }
}
