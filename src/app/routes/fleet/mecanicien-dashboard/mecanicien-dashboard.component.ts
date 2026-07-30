// mecanicien-dashboard.component.ts
import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule }                from '@angular/common';
import { RouterModule }                from '@angular/router';
import { MatCardModule }               from '@angular/material/card';
import { MatIconModule }               from '@angular/material/icon';
import { MatButtonModule }             from '@angular/material/button';
import { MatTableModule }              from '@angular/material/table';
import { MatChipsModule }              from '@angular/material/chips';
import { MatProgressBarModule }        from '@angular/material/progress-bar';
import { MatProgressSpinnerModule }    from '@angular/material/progress-spinner';
import { MatDividerModule }            from '@angular/material/divider';
import { MatTooltipModule }            from '@angular/material/tooltip';
import { MatBadgeModule }              from '@angular/material/badge';
import { Subscription }                from 'rxjs';

import { jwtDecode }                   from 'jwt-decode';

import {
  OrdreTravailResponse,
  PieceRechangeResponse,
} from '../ordre-travail/ordre-travail.model';
import { MachineMaintenanceRuleResponse } from '../machine-maintenance/machine-maintenance-rule.model';
import { OrdreTravailService }           from '../ordre-travail/ordre-travail.service';
import { MachineMaintenanceRuleService } from '../machine-maintenance/machine-maintenance-rule.service';
import { RoleDashboardStatsDto, RoleStatisticsService } from 'app/features/dashboard/role-statistics.service';
import { getEntrepriseId } from 'app/core/authentication/helpers';

@Component({
  selector: 'app-mecanicien-dashboard',
  templateUrl: './mecanicien-dashboard.component.html',
  styleUrl: './mecanicien-dashboard.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
})
export class MecanicienDashboardComponent implements OnInit, OnDestroy {

  private readonly roleStatsService       = inject(RoleStatisticsService);
  private readonly otService              = inject(OrdreTravailService);
  private readonly maintenanceRuleService = inject(MachineMaintenanceRuleService);
  private readonly cdr                    = inject(ChangeDetectorRef);
  private readonly zone                   = inject(NgZone);

  idEntreprise = getEntrepriseId() ?? 0;
  userName     = '';
  notifySub    = Subscription.EMPTY;

  loading = true;

  stats: RoleDashboardStatsDto = {
    idEntreprise: 0,
    facturesAujourdhui: 0, blEnAttente: 0, facturesImpayees: 0,
    echeancesMois: 0, paiementsEnAttente: 0, encaisseMois: 0,
    commandesTraitees: 0, commandesEnCours: 0,
    blDuJour: 0, stockCritique: 0,
    mesVehicules: 0, vehiculesDisponibles: 0, missionsEnCours: 0,
    maintenancesAVenir: 0, missionsTerminees: 0, pleinsCeMois: 0,
    coutCarburantMois: 0,
    mesMachines: 0, machinesEnPanne: 0, ordresTravailEnCours: 0,
    ordresTravailTermines: 0,
    machinesOperationnelles: 0, piecesCritiquesMeca: 0,
    reglesMaintenanceActives: 0, otPlanifiesMois: 0, coutMaintenanceMois: 0,
  };

  // Ordres de travail récents
  recentOTs: OrdreTravailResponse[] = [];
  otColumns = ['reference', 'entityRef', 'typeMaintenance', 'priorite', 'statut', 'scheduledDate'];
  loadingOTs = false;

  // Pièces critiques
  criticalParts: PieceRechangeResponse[] = [];
  partsColumns = ['reference', 'name', 'stockQty', 'minStockQty'];
  loadingParts = false;

  // Règles de maintenance urgentes
  urgentRules: MachineMaintenanceRuleResponse[] = [];
  rulesColumns = ['code', 'description', 'typeAction', 'heuresRestantes'];
  loadingRules = false;



  get tauxDisponibilite(): number {
    const total = this.stats.mesMachines;
    if (!total) return 0;
    return Math.round((this.stats.machinesOperationnelles / total) * 100);
  }

  ngOnInit() {
    this.loadUserName();
    this.loadStats();
    this.loadRecentOTs();
    this.loadCriticalParts();
    this.loadUrgentRules();

  }

  ngOnDestroy() { this.notifySub.unsubscribe(); }

  loadUserName(): void {
    const raw = localStorage.getItem('tms_access_token');
    if (!raw) return;
    try {
      const tok = JSON.parse(raw);
      const decoded: any = jwtDecode(tok.access_token);
      this.userName = decoded.name ?? decoded.prenom ?? decoded.sub ?? 'Mécanicien';
    } catch {}
  }

  loadStats(): void {
    this.loading = true;
    this.roleStatsService.getRoleDashboardStats(this.idEntreprise).subscribe({
      next: data => this.zone.run(() => {
        this.stats   = data;
        this.loading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => { this.loading = false; this.cdr.detectChanges(); }),
    });
  }

  loadRecentOTs(): void {
    this.loadingOTs = true;
    this.otService.findAll(0, 8).subscribe({
      next: page => this.zone.run(() => {
        this.recentOTs  = page.content ?? [];
        this.loadingOTs = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => { this.loadingOTs = false; this.cdr.detectChanges(); }),
    });
  }

  loadCriticalParts(): void {
    this.loadingParts = true;
    this.otService.findStockFaible().subscribe({
      next: parts => this.zone.run(() => {
        this.criticalParts = parts.slice(0, 6);
        this.loadingParts  = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => { this.loadingParts = false; this.cdr.detectChanges(); }),
    });
  }

  loadUrgentRules(): void {
    this.loadingRules = true;
    this.maintenanceRuleService.getAllRules().subscribe({
      next: rules => this.zone.run(() => {
        this.urgentRules = rules
          .filter(r => r.prochaineEcheanceProche && r.actif)
          .slice(0, 6);
        this.loadingRules = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => { this.loadingRules = false; this.cdr.detectChanges(); }),
    });
  }

  getStatutColor(statut: string): string {
    const map: Record<string, string> = {
      'DRAFT': '#94a3b8', 'PLANNED': '#3b82f6', 'IN_PROGRESS': '#f59e0b',
      'ON_HOLD': '#8b5cf6', 'COMPLETED': '#10b981', 'CANCELLED': '#ef4444',
    };
    return map[statut] ?? '#94a3b8';
  }

  getPrioriteColor(priorite: string): string {
    const map: Record<string, string> = {
      'LOW': '#10b981', 'NORMAL': '#3b82f6', 'HIGH': '#f59e0b', 'CRITICAL': '#ef4444',
    };
    return map[priorite] ?? '#94a3b8';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      'DRAFT': 'Brouillon', 'PLANNED': 'Planifié', 'IN_PROGRESS': 'En cours',
      'ON_HOLD': 'En pause', 'COMPLETED': 'Terminé', 'CANCELLED': 'Annulé',
    };
    return map[statut] ?? statut;
  }

  getPrioriteLabel(priorite: string): string {
    const map: Record<string, string> = {
      'LOW': 'Basse', 'NORMAL': 'Normale', 'HIGH': 'Haute', 'CRITICAL': 'Critique',
    };
    return map[priorite] ?? priorite;
  }
}
