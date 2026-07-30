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

  update<T>(path: string, id: number, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}/${id}`, body);
  }

  delete(path: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${path}/${id}`);
  }

  patch<T>(path: string, id: number, subPath = ''): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}/${id}${subPath}`, {});
  }

  // Paths
  readonly paths = {
    vehicles: '/vehicles',
    drivers: '/drivers',
    customers: '/customers',
    amazonPurchases: '/amazon-purchases',
    customerOrders: '/customer-orders',
    missions: '/missions',
    fuelRecords: '/fuel-records',
    maintenanceRecords: '/maintenance-records',
    spareParts: '/spare-parts',
    financialEntries: '/financial-entries',
    notifications: '/notifications',
    machines: '/machines',
    workOrders: '/work-orders',
    tires: '/tires',
    tireAssignments: '/tires/assignments',
    oilChanges: '/oil-changes',
    fleetDocuments: '/fleet-documents',
    maintenancePlans: '/maintenance-plans'
  };
}
