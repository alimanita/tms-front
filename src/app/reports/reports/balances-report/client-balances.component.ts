import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe }      from '@angular/common';
import { RouterModule }                   from '@angular/router';
import { FormsModule }                    from '@angular/forms';
import { MatIconModule }                  from '@angular/material/icon';
import { MatProgressSpinnerModule }       from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient }                     from '@angular/common/http';

import { ClientStatsComponent } from '../clientsStats/client-stats.component';
import { AutocompleteComponent, AutocompleteOption } from 'app/shared/autocomplete/autocomplete.component';
import { getEntrepriseId } from 'app/core/authentication/helpers';
import { environment } from 'environments/environment';



// ── DTOs ─────────────────────────────────────────────────────────────────────

/** Correspond exactement aux alias SQL + champs du DTO Java ClientSoldeDto */
interface ClientSolde {
  id                  : number;         // c.id
  nom                 : string;
  prenom              : string | null;
  matriculeFiscal     : string | null;
  totalBls            : number;         // SUM net_a_payer BL VALIDEE/LIVREE
  totalEncaissements  : number;         // SUM montant_paiement ENCAISSEMENT
  solde               : number;         // solde_depart - totalBls + totalEncaissements
  datePremiereCreance : string | null;  // MIN creation_date BL VALIDEE/LIVREE
  nombreBls           : number;         // COUNT BL VALIDEE/LIVREE
  datePremierBl       : string | null;  // MIN creation_date tout état
}

export type ScoreLabel = 'CRITIQUE' | 'ÉLEVÉ' | 'MODÉRÉ' | 'FAIBLE';

interface ClientAvecScore extends ClientSolde {
  score             : number;
  scoreLabel        : ScoreLabel;
  joursDebt         : number;
  frequenceMensuelle: number;
}

// ── Résumé client pour l'autocomplete ────────────────────────────────────────

interface ClientResume {
  id             : number;
  nom            : string;
  prenom         : string | null;
  matriculeFiscal: string | null;
}

// ── Calcul du score ───────────────────────────────────────────────────────────

function calculerScore(c: ClientSolde): ClientAvecScore {
  const now = Date.now();

  // 1. Ratio dette / CA — poids 40 %
  const dette      = Math.max(0, -Number(c.solde));
  const totalBls   = Number(c.totalBls);
  const ratioDette = totalBls > 0 ? dette / totalBls : 0;
  const scoreRatio = Math.min(ratioDette * 100, 100) * 0.40;

  // 2. Ancienneté de la dette — poids 35 %
  const joursDebt = (c.datePremiereCreance && Number(c.solde) < 0)
    ? (now - new Date(c.datePremiereCreance).getTime()) / 86_400_000
    : 0;
  const scoreAnciennete = Math.min(joursDebt / 90, 1) * 35;

  // 3. Fréquence d'achat (inversée) — poids 25 %
  const moisRelation = c.datePremierBl
    ? Math.max(1, (now - new Date(c.datePremierBl).getTime()) / (86_400_000 * 30))
    : 1;
  const frequenceMensuelle = Number(c.nombreBls) / moisRelation;
  const scoreFrequence     = Number(c.solde) < 0
    ? Math.max(0, 1 - frequenceMensuelle / 14) * 25
    : 0;

  const score = Math.round(scoreRatio + scoreAnciennete + scoreFrequence);

  const scoreLabel: ScoreLabel =
    score >= 75 ? 'CRITIQUE' :
    score >= 50 ? 'ÉLEVÉ'   :
    score >= 25 ? 'MODÉRÉ'  : 'FAIBLE';

  return {
    ...c,
    score,
    scoreLabel,
    joursDebt         : Math.round(joursDebt),
    frequenceMensuelle: Math.round(frequenceMensuelle * 10) / 10,
  };
}

// ── Composant ─────────────────────────────────────────────────────────────────

@Component({
  selector   : 'app-client-balances',
  standalone : true,
  imports    : [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, DecimalPipe,
    AutocompleteComponent,
    ClientStatsComponent,
  ],
  templateUrl: './client-balances.component.html',
  styleUrls  : ['./client-balances.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientBalancesComponent implements OnInit {
  private http     = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  idEntreprise     = getEntrepriseId();

  // ── Signals ──────────────────────────────────────────────────────────────
  allClients        = signal<ClientSolde[]>([]);
  clientsResume     = signal<ClientResume[]>([]);
  search            = signal('');
  dateDebut         = signal('');
  dateFin           = signal('');
  pageIndex         = signal(0);
  loading           = signal(false);
  selectedClientId  = signal<number | null>(null);   // ← client sélectionné pour les stats
  readonly pageSize = 10;

  // ── Options autocomplete ─────────────────────────────────────────────────
  clientsOptions = computed<AutocompleteOption[]>(() =>
    this.allClients().map(c => ({
      id      : c.id,
      label   : `${c.nom}${c.prenom ? ' ' + c.prenom : ''}`,
      sublabel: c.matriculeFiscal ?? '',
    }))
  );

  clientDisplayFn = (opt: AutocompleteOption) =>
    `${opt.label}${opt.sublabel ? ' — ' + opt.sublabel : ''}`;

  // ── Client sélectionné (objet complet) ──────────────────────────────────
  selectedClient = computed<ClientAvecScore | null>(() => {
    const id = this.selectedClientId();
    if (id == null) return null;
    const found = this.scored().find(c => c.id === id);
    return found ?? null;
  });

  // ── Computed ─────────────────────────────────────────────────────────────

  scored = computed<ClientAvecScore[]>(() => {
    const q = this.search().trim().toLowerCase();

    return this.allClients()
      .filter(c => {
        return !q ||
          c.nom.toLowerCase().includes(q) ||
          (c.prenom          ?? '').toLowerCase().includes(q) ||
          (c.matriculeFiscal ?? '').toLowerCase().includes(q);
      })
      .map(calculerScore)
     .sort((a, b) => Number(a.solde) - Number(b.solde));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.scored().length / this.pageSize)));
  startIndex = computed(() => this.pageIndex() * this.pageSize);
  endIndex   = computed(() => Math.min(this.startIndex() + this.pageSize, this.scored().length));
  paginated  = computed(() => this.scored().slice(this.startIndex(), this.endIndex()));

  totalNetAPayer     = computed(() => this.scored().reduce((s, c) => s + Number(c.totalBls),           0));
  totalEncaissements = computed(() => this.scored().reduce((s, c) => s + Number(c.totalEncaissements), 0));
  totalSolde         = computed(() => this.scored().reduce((s, c) => s + Number(c.solde),              0));

  // ── Helpers template ─────────────────────────────────────────────────────

  scoreLabelClass(label: ScoreLabel): string {
    return ({
      'CRITIQUE': 'badge-critique',
      'ÉLEVÉ'   : 'badge-eleve',
      'MODÉRÉ'  : 'badge-modere',
      'FAIBLE'  : 'badge-faible',
    } as Record<ScoreLabel, string>)[label];
  }

  scoreTooltip(c: ClientAvecScore): string {
    return [
      `Score : ${c.score}/100`,
      `Dette : ${Math.max(0, -Number(c.solde)).toFixed(3)} DT`,
      c.joursDebt > 0 ? `Ancienneté : ${c.joursDebt} j` : '',
      `Net à payer : ${Number(c.totalBls).toFixed(3)} DT`,
      `Fréquence : ${c.frequenceMensuelle} BL/mois`,
    ].filter(Boolean).join(' · ');
  }

  // ── Sélection client depuis autocomplete ─────────────────────────────────

  onClientSelected(opt: AutocompleteOption): void {
    this.selectedClientId.set(opt ? Number(opt.id) : null);
    // Aussi filtrer la table sur ce client
    this.search.set(opt ? opt.label : '');
    this.pageIndex.set(0);
  }

  closeStats(): void {
    this.selectedClientId.set(null);
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  onSearch(v: string)   : void { this.search.set(v);    this.pageIndex.set(0); }
  onDateDebut(v: string): void { this.dateDebut.set(v); this.pageIndex.set(0); }
  onDateFin(v: string)  : void { this.dateFin.set(v);   this.pageIndex.set(0); }
  prevPage()            : void { this.pageIndex.update(p => p - 1); }
  nextPage()            : void { this.pageIndex.update(p => p + 1); }

  resetFilters(): void {
    this.search.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
    this.selectedClientId.set(null);
    this.pageIndex.set(0);
  }

  // ── Clic sur une ligne → ouvrir les stats ────────────────────────────────
  selectRow(c: ClientAvecScore): void {
    this.selectedClientId.set(c.id);
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  load(): void {
    if (!this.idEntreprise) return;
    this.loading.set(true);
    this.http
      .get<ClientSolde[]>(`${environment.baseUrl}/clients/soldes`, {
        params: { idEntreprise: this.idEntreprise },
      })
      .subscribe({
        next : data => { this.allClients.set(data); this.loading.set(false); },
        error: ()   => {
          this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
          this.loading.set(false);
        },
      });
  }

  exportPdf()  : void { this.snackBar.open('Export PDF en cours de développement',   'Fermer', { duration: 3000 }); }
  exportExcel(): void { this.snackBar.open('Export Excel en cours de développement', 'Fermer', { duration: 3000 }); }
}