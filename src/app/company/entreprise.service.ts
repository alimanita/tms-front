import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';



export interface AdresseDto {
  adresse1: string;
  adresse2?: string;
  ville: string;
  codePostale: string;
  pays: string;
}

export interface UtilisateurAdminDto {
  nom: string;
  prenom: string;
  email: string;
  login: string;
  password: string;
}

export interface EntrepriseDto {
  id?: number;
  nom: string;
  description?: string;
  adresse: AdresseDto;
  codeFiscal?: string;
  photo?: string;
  email: string;
  numTel: string;
  steWeb?: string;
  matriculeFiscal: string;
}

export interface EntrepriseRegistrationDto {
  nom: string;
  description?: string;
  email: string;
  numTel: string;
  matriculeFiscal: string;
  codeFiscal?: string;
  steWeb?: string;
  adresse: AdresseDto;
  utilisateurAdmin: UtilisateurAdminDto;
}

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {
  private apiUrl = `${environment.baseUrl}/entreprises`;

  constructor(private http: HttpClient) {}

  /**
   * Enregistrer une nouvelle entreprise avec son administrateur
   */
  registerEntreprise(data: EntrepriseRegistrationDto): Observable<EntrepriseDto> {
    return this.http.post<EntrepriseDto>(`${this.apiUrl}/register`, data);
  }

  /**
   * Créer ou modifier une entreprise
   */
  save(entreprise: EntrepriseDto): Observable<EntrepriseDto> {
    return this.http.post<EntrepriseDto>(`${this.apiUrl}/create`, entreprise);
  }

  /**
   * Rechercher une entreprise par ID
   */
  findById(id: number): Observable<EntrepriseDto> {
    return this.http.get<EntrepriseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lister toutes les entreprises
   */
  findAll(): Observable<EntrepriseDto[]> {
    return this.http.get<EntrepriseDto[]>(`${this.apiUrl}/all`);
  }

  /**
   * Supprimer une entreprise
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  /**
   * Rechercher une entreprise par email
   */
  findByEmail(email: string): Observable<EntrepriseDto> {
    return this.http.get<EntrepriseDto>(`${this.apiUrl}/email/${email}`);
  }

  /**
   * Rechercher une entreprise par matricule fiscal
   */
  findByMatriculeFiscal(matriculeFiscal: string): Observable<EntrepriseDto> {
    return this.http.get<EntrepriseDto>(`${this.apiUrl}/matricule/${matriculeFiscal}`);
  }
}