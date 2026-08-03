import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';

import { finalize } from 'rxjs/operators';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';

interface LigneRapport {
  idFacture: number;
  reference: string;
  date: string;
  contact: string;
  ht: number;
  fodec: number;
  tva: number;
  timbre: number;
  ttc: number;
  resteAPayer: number;
}
interface Totaux {
  totalHt: number; totalFodec: number; totalTva: number;
  totalTimbre: number; totalTtc: number; totalResteAPayer: number;
}
interface Client { id: number; nom: string; prenom?: string; }

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,
            MatIconModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './sales-report.html',
  styleUrls: ['./sales-report.scss'],
})
export class ReportsReportsSalesReport implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private idEntreprise = getEntrepriseId() ?? 0;

  lignes: LigneRapport[] = [];
  totaux: Totaux | null = null;
  clients: Client[] = [];
  loading = false;

  // Filtres
  dateDebut = '';
  dateFin = new Date().toISOString().split('T')[0];
  selectedClientId: number | null = null;
  clientSearch = '';
  showClientDropdown = false;

  get filteredClients(): Client[] {
    if (!this.clientSearch) return this.clients;
    const q = this.clientSearch.toLowerCase();
    return this.clients.filter(c =>
      (c.nom + ' ' + (c.prenom || '')).toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.loadClients();
    this.load();
  }

  loadClients(): void {
    this.http.get<Client[]>(
      `${environment.baseUrl}/clients/all/resume`,
      { params: { idEntreprise: this.idEntreprise } }
    ).subscribe({
      next: (clients) => { this.clients = clients; },
      error: (err) => console.error('Erreur chargement clients', err)
    });
  }

  onBlur(): void {
    setTimeout(() => { this.showClientDropdown = false; }, 200);
  }

  selectClient(c: Client | null): void {
    this.selectedClientId = c?.id ?? null;
    this.clientSearch = c ? (c.nom + (c.prenom ? ' ' + c.prenom : '')) : '';
    this.showClientDropdown = false;
  }

 load(): void {
    this.loading = true;
    this.lignes = [];
    this.totaux = null;

    let params = new HttpParams()
      .set('idEntreprise', this.idEntreprise);

    if (this.selectedClientId)
      params = params.set('idClient', this.selectedClientId);
    if (this.dateDebut)
      params = params.set('dateDebut', new Date(this.dateDebut).toISOString());
    if (this.dateFin)
      params = params.set('dateFin', new Date(this.dateFin + 'T23:59:59').toISOString());

    this.http.get<any>(`${environment.baseUrl}/rapports/ventes/par-client`, { params })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();  // ← notifie Angular du changement
      }))
      .subscribe({
        next: (data) => {
          console.log('RAPPORT DATA:', data);
          this.lignes = data.lignes ?? [];
          this.totaux = data.totaux ?? null;
        },
        error: (err) => {
          console.error('RAPPORT ERROR:', err);
        }
      });
  }


  reset(): void {
    this.dateDebut = '';
    this.dateFin = new Date().toISOString().split('T')[0];
    this.selectedClientId = null;
    this.clientSearch = '';
    this.load();
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  isAvoir(ref: string): boolean {
    return ref?.startsWith('AV-');
  }
}