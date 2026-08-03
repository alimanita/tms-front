import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';
import { ModeCountPipe } from 'app/shared/pipes/ModeCountPipe';



export type ModePaiement =
  | 'ESPECES' | 'VIREMENT_BANCAIRE' | 'CHEQUE'
  | 'TRAITE'  | 'CARTE_CREDIT'      | 'RETENUE_SOURCE' | 'AUTRE';

export interface PaiementLigne {
  id: number;
  datePaiement: string;
  contact: string;
  montant: number;
  modePaiement: ModePaiement;
  reference: string;
  etatPaiement: string;
  montantRetenue: number;
}

export interface PaiementRapport {
  nombrePaiements: number;
  montantTotalRecu: number;
  montantTotalEncaisse: number;
  montantTotalRetenue: number;
  repartitionParMethode: Record<string, number>;
  pourcentageParMethode: Record<string, number>;
  lignes: PaiementLigne[];
}

export interface DonutSegment {
  mode: string;
  montant: number;
  pct: number;
  color: string;
  offset: number;
}

const MODE_COLORS: Record<string, string> = {
  ESPECES:          '#10b981',
  VIREMENT_BANCAIRE:'#3b82f6',
  CHEQUE:           '#f59e0b',
  TRAITE:           '#8b5cf6',
  CARTE_CREDIT:     '#ec4899',
  RETENUE_SOURCE:   '#64748b',
  AUTRE:            '#94a3b8',
};

const MODE_LABELS: Record<string, string> = {
  ESPECES:           'Espèces',
  VIREMENT_BANCAIRE: 'Virement bancaire',
  CHEQUE:            'Chèque',
  TRAITE:            'Traite',
  CARTE_CREDIT:      'Carte de crédit',
  RETENUE_SOURCE:    'Retenue à la source',
  AUTRE:             'Autre',
};

@Component({
  selector: 'app-reports-reports-financial-report',
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatDatepickerModule, MatFormFieldModule,
    MatInputModule, MatNativeDateModule, ModeCountPipe  
  ],
  templateUrl: './financial-report.html',
  styleUrl:    './financial-report.scss'
})
export class ReportsReportsFinancialReport implements OnInit {

  readonly ID_ENTREPRISE = getEntrepriseId() ?? 0;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  activeTab = signal<'recus' | 'emis'>('recus');

  // ── Filters ───────────────────────────────────────────────────────────────
dateDebut: string = '';
dateFin: string   = '';
  modePaiement: string   = '';

  readonly MODES: { value: string; label: string }[] = [
    { value: '',                label: 'Toutes les méthodes' },
    { value: 'ESPECES',          label: 'Espèces'             },
    { value: 'VIREMENT_BANCAIRE',label: 'Virement bancaire'   },
    { value: 'CHEQUE',           label: 'Chèque'              },
    { value: 'TRAITE',           label: 'Traite'              },
    { value: 'CARTE_CREDIT',     label: 'Carte de crédit'     },
    { value: 'RETENUE_SOURCE',   label: 'Retenue à la source' },
    { value: 'AUTRE',            label: 'Autre'               },
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  loading = signal(false);
  rapport = signal<PaiementRapport | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize   = 10;
  pageIndex  = 0;

  lignesPaged = computed(() => {
    const all = this.rapport()?.lignes ?? [];
    const start = this.pageIndex * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  totalPages = computed(() =>
    Math.ceil((this.rapport()?.lignes?.length ?? 0) / this.pageSize)
  );

  // ── Donut segments ────────────────────────────────────────────────────────
  donutSegments = computed<DonutSegment[]>(() => {
    const r = this.rapport();
    if (!r) return [];
    const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54
    let offset = 0;
    return Object.entries(r.repartitionParMethode).map(([mode, montant]) => {
      const pct  = r.pourcentageParMethode[mode] ?? 0;
      const dash = (pct / 100) * CIRCUMFERENCE;
      const seg: DonutSegment = { mode, montant, pct, color: MODE_COLORS[mode] ?? '#94a3b8', offset };
      offset += dash;
      return seg;
    });
  });

  readonly CIRCUMFERENCE = 2 * Math.PI * 54;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.load(); }

  // ── API ───────────────────────────────────────────────────────────────────
 load() {
  this.loading.set(true);
  this.pageIndex = 0;

  const endpoint = this.activeTab() === 'recus' ? 'encaissements' : 'decaissements';
  let params = new HttpParams().set('idEntreprise', this.ID_ENTREPRISE);

  if (this.dateDebut) {
    // "2026-04-28" → "2026-04-28T00:00:00.000Z"
    params = params.set('dateDebut', `${this.dateDebut}T00:00:00.000Z`);
  }
  if (this.dateFin) {
    // fin de journée
    params = params.set('dateFin', `${this.dateFin}T23:59:59.999Z`);
  }
  if (this.modePaiement) {
    params = params.set('modePaiement', this.modePaiement);
  }

  this.http.get<PaiementRapport>(
    `${environment.baseUrl}/paiements/rapports/${endpoint}`, { params }
  ).subscribe({
    next: data => { this.rapport.set(data); this.loading.set(false); },
    error: err  => { console.error(err);    this.loading.set(false); }
  });
}


  clearFilters() {
    this.dateDebut    = ''
    this.dateFin      = ''
    this.modePaiement = '';
    this.load();
  }

  switchTab(tab: 'recus' | 'emis') {
    this.activeTab.set(tab);
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  modeLabel(mode: string): string { return MODE_LABELS[mode] ?? mode; }
  modeColor(mode: string): string { return MODE_COLORS[mode] ?? '#94a3b8'; }

  prevPage() { if (this.pageIndex > 0) this.pageIndex--; }
  nextPage() { if (this.pageIndex < this.totalPages() - 1) this.pageIndex++; }

  get displayStart() { return this.pageIndex * this.pageSize + 1; }
  get displayEnd()   {
    return Math.min((this.pageIndex + 1) * this.pageSize,
                    this.rapport()?.lignes?.length ?? 0);
  }

  goBack() { this.router.navigate(['../'], { relativeTo: null }); }
}


