import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MachineMaintenanceRuleRequest, MachineMaintenanceRuleResponse } from './machine-maintenance-rule.model';
import { environment } from 'environments/environments/environment';


@Injectable({ providedIn: 'root' })
export class MachineMaintenanceRuleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/fleet/machine-maintenance-rules`;

  findByMachineId(machineId: number): Observable<MachineMaintenanceRuleResponse[]> {
    return this.http.get<MachineMaintenanceRuleResponse[]>(`${this.base}/machine/${machineId}`);
  }

  findById(id: number): Observable<MachineMaintenanceRuleResponse> {
    return this.http.get<MachineMaintenanceRuleResponse>(`${this.base}/${id}`);
  }

  create(request: MachineMaintenanceRuleRequest): Observable<MachineMaintenanceRuleResponse> {
    return this.http.post<MachineMaintenanceRuleResponse>(this.base, request);
  }

  update(id: number, request: MachineMaintenanceRuleRequest): Observable<MachineMaintenanceRuleResponse> {
    return this.http.put<MachineMaintenanceRuleResponse>(`${this.base}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  marquerEffectuee(id: number, heuresActuelles: number): Observable<MachineMaintenanceRuleResponse> {
    const params = new HttpParams().set('heuresActuelles', heuresActuelles);
    return this.http.patch<MachineMaintenanceRuleResponse>(`${this.base}/${id}/marquer-effectuee`, null, { params });
  }

  getAllRules(): Observable<MachineMaintenanceRuleResponse[]> {
    return this.http.get<MachineMaintenanceRuleResponse[]>(this.base);
  }
}