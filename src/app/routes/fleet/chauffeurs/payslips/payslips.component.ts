import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-payslips',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, ReactiveFormsModule],
  template: `
    <div class="fleet-page">
      <div class="fleet-topbar">
        <h2 class="fleet-title">Fiches de paie</h2>
        <button class="fl-btn fl-btn-ghost" (click)="goBack()">← Retour</button>
      </div>
      <div class="fleet-body">
        
        <form [formGroup]="form" (ngSubmit)="onCalculate()" class="fl-form" style="margin-bottom: 20px;">
          <div class="fl-grid" style="grid-template-columns: 1fr 1fr auto; align-items: end;">
            <div class="fl-field">
              <label>Mois (YYYY-MM)</label>
              <input formControlName="moisAnnee" type="month" />
            </div>
            <div>
              <button class="fl-btn fl-btn-primary" type="submit" [disabled]="loading || form.invalid">
                Calculer & Générer
              </button>
            </div>
          </div>
        </form>

        <div class="fl-table-container">
          <table class="mat-mdc-table">
            <thead class="mdc-data-table__header-row">
              <tr>
                <th class="mat-mdc-header-cell">Mois</th>
                <th class="mat-mdc-header-cell">Montant Calculé</th>
                <th class="mat-mdc-header-cell">Document</th>
                <th class="mat-mdc-header-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payslips" class="mat-mdc-row">
                <td class="mat-mdc-cell">{{ p.moisAnnee }}</td>
                <td class="mat-mdc-cell">{{ p.montantCalcule | number:'1.2-2' }} MAD</td>
                <td class="mat-mdc-cell">
                  <a *ngIf="p.urlDocument" [href]="getDocUrl(p.urlDocument)" target="_blank" class="status-chip chip-active">Voir document</a>
                  <span *ngIf="!p.urlDocument" class="status-chip chip-muted">Aucun</span>
                </td>
                <td class="mat-mdc-cell">
                  <input type="file" #fileInput style="display: none" (change)="onUpload($event, p.id)" />
                  <button class="fl-btn fl-btn-secondary" (click)="fileInput.click()">Déposer Fiche</button>
                </td>
              </tr>
              <tr *ngIf="payslips.length === 0">
                <td class="mat-mdc-cell" colspan="4" style="text-align: center; padding: 20px;">Aucune fiche de paie trouvée.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PayslipsComponent implements OnInit {
  chauffeurId!: number;
  payslips: any[] = [];
  loading = false;
  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      moisAnnee: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chauffeurId = +id;
        this.loadPayslips();
      }
    });
  }

  loadPayslips(): void {
    this.http.get<any[]>(`${environment.baseUrl}/fleet/fiches-paie/chauffeur/${this.chauffeurId}`)
      .subscribe({
        next: (data) => this.payslips = data,
        error: () => this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 })
      });
  }

  onCalculate(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const mois = this.form.value.moisAnnee;
    this.http.post(`${environment.baseUrl}/fleet/fiches-paie/calculer?chauffeurId=${this.chauffeurId}&moisAnnee=${mois}`, {})
      .subscribe({
        next: () => {
          this.snackBar.open('Calcul terminé', 'Fermer', { duration: 3000 });
          this.loadPayslips();
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Erreur lors du calcul', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  onUpload(event: any, payslipId: number): void {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.baseUrl}/fleet/fiches-paie/${payslipId}/upload`, formData)
      .subscribe({
        next: () => {
          this.snackBar.open('Fiche déposée', 'Fermer', { duration: 3000 });
          this.loadPayslips();
        },
        error: () => this.snackBar.open('Erreur lors du dépôt', 'Fermer', { duration: 3000 })
      });
  }

  getDocUrl(filename: string): string {
    return `${environment.baseUrl}/files/payslips/${filename}`;
  }

  goBack(): void {
    this.router.navigate(['/fleet/chauffeurs']);
  }
}
