import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';


@Component({
  selector: 'app-tva-sur-vente',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './tva-sur-vente.html',
  styleUrls: ['./tva-sur-vente.scss'],
})
export class ReportsReportsTvaSurVente implements OnInit {
  private http = inject(HttpClient);
  private idEntreprise = getEntrepriseId() ?? 0;

  lignes: any[] = [];
  totaux: any = null;
  loading = false;
  dateDebut = '';
  dateFin = new Date().toISOString().split('T')[0];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    let params = new HttpParams().set('idEntreprise', this.idEntreprise);
    if (this.dateDebut) params = params.set('dateDebut', new Date(this.dateDebut).toISOString());
    if (this.dateFin)   params = params.set('dateFin',   new Date(this.dateFin + 'T23:59:59').toISOString());

    this.http.get<any>(`${environment.baseUrl}/rapports/ventes/tva`, { params }).subscribe({
      next: d => { this.lignes = d.lignes ?? []; this.totaux = d.totaux; this.loading = false; },
      error: () => this.loading = false
    });
  }

  reset(): void { this.dateDebut = ''; this.dateFin = new Date().toISOString().split('T')[0]; this.load(); }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
  }
}