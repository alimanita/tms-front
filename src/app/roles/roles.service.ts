// src/app/roles/roles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environments/environment';

export interface RoleDto {
  id?: number;
  roleName: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly baseUrl = `${environment.baseUrl}/roles`;

  constructor(private http: HttpClient) {}

  save(dto: RoleDto): Observable<RoleDto> {
    return this.http.post<RoleDto>(`${this.baseUrl}/create`, dto);
  }

  findById(id: number): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.baseUrl}/${id}`);
  }

  findAll(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/all`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}