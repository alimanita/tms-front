import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-purchases-report',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule,
            MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './purchases-report.html',
  styleUrls: ['./purchases-report.scss'],
})
export class ReportsReportsPurchasesReport implements OnInit {
  private http         = inject(HttpClient);
  private cdr          = inject(ChangeDetectorRef);
  private idEntreprise = getEntrepriseId() ?? 0;

  lignes:   any[] = [];
  totaux:   any   = null;
  clients:  any[] = [];
  articles: any[] = [];
  loading = false;

  dateDebut          = '';
  dateFin            = new Date().toISOString().split('T')[0];
  selectedClientId:  number | null = null;
  selectedArticleId: number | null = null;
  clientSearch  = '';
  articleSearch = '';
  showClientDd  = false;
  showArticleDd = false;

  get filteredClients() {
    const q = this.clientSearch.toLowerCase();
    return this.clients.filter(c =>
      (c.nom + ' ' + (c.prenom || '')).toLowerCase().includes(q));
  }

  get filteredArticles() {
    const q = this.articleSearch.toLowerCase();
    return this.articles.filter(a =>
      (a.designation || '').toLowerCase().includes(q));
  }

  ngOnInit(): void {
    forkJoin({
      clients:  this.http.get<any[]>(`${environment.baseUrl}/clients/all/resume`, {
        params: new HttpParams().set('idEntreprise', this.idEntreprise)
      }),
      articles: this.http.get<any[]>(`${environment.baseUrl}/articles/all`, {
        params: new HttpParams().set('idEntreprise', this.idEntreprise)
      })
    }).subscribe({
      next: ({ clients, articles }) => {
        this.clients  = clients;
        this.articles = articles;
        this.load();
      },
      error: (err) => console.error('Erreur init', err)
    });
  }

  onBlurClient():  void { setTimeout(() => this.showClientDd  = false, 200); }
  onBlurArticle(): void { setTimeout(() => this.showArticleDd = false, 200); }

  selectClient(c: any): void {
    this.selectedClientId = c?.id ?? null;
    this.clientSearch     = c ? (c.nom + (c.prenom ? ' ' + c.prenom : '')) : '';
    this.showClientDd     = false;
  }

  selectArticle(a: any): void {
    this.selectedArticleId = a?.id ?? null;
    this.articleSearch     = a ? a.designation : '';
    this.showArticleDd     = false;
  }

  load(): void {
    this.loading = true;
    this.lignes  = [];
    this.totaux  = null;
    this.cdr.detectChanges();   // ← notifie Angular que loading=true

    let params = new HttpParams().set('idEntreprise', this.idEntreprise);
    if (this.selectedClientId)  params = params.set('idClient',  this.selectedClientId);
    if (this.selectedArticleId) params = params.set('idArticle', this.selectedArticleId);
    if (this.dateDebut) params = params.set('dateDebut', new Date(this.dateDebut).toISOString());
    if (this.dateFin)   params = params.set('dateFin',   new Date(this.dateFin + 'T23:59:59').toISOString());

    this.http.get<any>(`${environment.baseUrl}/rapports/ventes/par-article`, { params })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();  // ← notifie Angular que loading=false
      }))
      .subscribe({
        next: (d) => {
          this.lignes = d.lignes ?? [];
          this.totaux = d.totaux ?? null;
        },
        error: (err) => console.error('Erreur rapport', err)
      });
  }

  reset(): void {
    this.dateDebut         = '';
    this.dateFin           = new Date().toISOString().split('T')[0];
    this.selectedClientId  = null;
    this.selectedArticleId = null;
    this.clientSearch      = '';
    this.articleSearch     = '';
    this.load();
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : '';
  }
}