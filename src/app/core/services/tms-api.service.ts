import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../models/page.model';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class TmsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  // Dashboard
  getDashboard(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  // Generic CRUD helpers
  list<T>(path: string, page = 0, size = 50): Observable<PageResponse<T>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<T>>(`${this.baseUrl}${path}`, { params });
  }

  get<T>(path: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}/${id}`);
  }

  create<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  /** Crée une ressource en multipart/form-data (ex: plein carburant avec photo) */
  createMultipart<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, formData);
  }

  update<T>(path: string, id: number, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}/${id}`, body);
  }

  delete(path: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${path}/${id}`);
  }

  patch<T>(path: string, id: number, subPath = ''): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}/${id}${subPath}`, {});
  }

  // Paths — correspondent aux routes réelles du backend Spring Boot
  readonly paths = {
    vehicles: '/fleet/vehicules',
    drivers: '/fleet/chauffeurs',
    customers: '/customers',
    customerOrders: '/customer-orders',
    missions: '/fleet/missions',
    fuelRecords: '/fleet/pleins-carburant',
    maintenanceRecords: '/fleet/changements-huile',
    spareParts: '/fleet/pieces-rechange',
    financialEntries: '/financial-entries',
    notifications: '/notifications',
    machines: '/fleet/machines',
    workOrders: '/fleet/ordres-travail',
    tires: '/fleet/pneus',
    tireAssignments: '/fleet/pneus/assignments',
    oilChanges: '/fleet/changements-huile',
    fleetDocuments: '/fleet/documents',
    maintenancePlans: '/fleet/plans-maintenance'
  };
}
