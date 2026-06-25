import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class TmsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Dashboard
  getDashboard(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/api/v1/dashboard`);
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
    vehicles: '/api/v1/vehicles',
    drivers: '/api/v1/drivers',
    customers: '/api/v1/customers',
    amazonPurchases: '/api/v1/amazon-purchases',
    customerOrders: '/api/v1/customer-orders',
    missions: '/api/v1/missions',
    fuelRecords: '/api/v1/fuel-records',
    maintenanceRecords: '/api/v1/maintenance-records',
    spareParts: '/api/v1/spare-parts',
    financialEntries: '/api/v1/financial-entries',
    notifications: '/api/v1/notifications'
  };
}
