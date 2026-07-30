// src/app/routes/admin/utilisateur/utilisateur.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UtilisateurDto, ChangerMotDePasseDto } from './utilisateur.model';
import { environment } from 'environments/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {

  private readonly baseUrl = `${environment.baseUrl}/utilisateurs`;
  constructor(private http: HttpClient) {}



private errorHandler(e: HttpErrorResponse): Observable<never> {
  console.error('Erreur utilisateur service:', e);
  return throwError(() => e); // <-- propage l'erreur au lieu de la masquer
}
  private getToken(): string | null {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  save(dto: UtilisateurDto): Observable<UtilisateurDto> {
    return this.http
      .post<UtilisateurDto>(`${this.baseUrl}/create`, dto)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  /**
   * Mettre à jour un utilisateur existant
   * ⚠️ adapte l'URL si l'endpoint backend diffère (ex: PUT /utilisateurs/{id})
   */
  update(id: number, dto: UtilisateurDto): Observable<UtilisateurDto> {
    return this.http
      .put<UtilisateurDto>(`${this.baseUrl}/update/${id}`, dto)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  changerMotDePasse(dto: ChangerMotDePasseDto): Observable<UtilisateurDto> {
    return this.http
      .post<UtilisateurDto>(`${this.baseUrl}/update/password`, dto)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  findById(id: number): Observable<UtilisateurDto> {
    return this.http
      .get<UtilisateurDto>(`${this.baseUrl}/${id}`)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  findByEmail(email: string): Observable<UtilisateurDto> {
    return this.http
      .get<UtilisateurDto>(`${this.baseUrl}/find/${email}`)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  findAll(): Observable<UtilisateurDto[]> {
    return this.http
      .get<UtilisateurDto[]>(`${this.baseUrl}/all`)
      .pipe(catchError(e => this.errorHandler(e)));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/delete/${id}`)
      .pipe(catchError(e => this.errorHandler(e)));
  }


}