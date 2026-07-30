// chauffeur-dashboard.component.ts
import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule, DatePipe }   from '@angular/common';
import { RouterModule }             from '@angular/router';
import { MatCardModule }            from '@angular/material/card';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatTableModule }           from '@angular/material/table';
import { MatChipsModule }           from '@angular/material/chips';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }         from '@angular/material/divider';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatBadgeModule }           from '@angular/material/badge';
import { Subscription }             from 'rxjs';
import { getEntrepriseId }          from '../core/authentication/helpers';
import { jwtDecode }                from 'jwt-decode';
import { SettingsService } from 'app/core/services/settings.service';
import { RoleDashboardStatsDto, RoleStatisticsService } from 'app/features/dashboard/role-statistics.service';
import { MissionService } from 'fleet/mission/mission.service';
import { FleetService, PleinCarburantResponse } from 'fleet/fleet.service';
import { MissionResponse, StatutMission } from 'fleet/mission/mission.model';


@Component({
  selector: 'app-chauffeur-dashboard',
  templateUrl: './chauffeur-dashboard.component.html',
  styleUrl: './chauffeur-dashboard.component.scss',
  imports: [
    CommonModule,
    DatePipe,
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
export class ChauffeurDashboardComponent implements OnInit, OnDestroy {
  private readonly settings         = inject(SettingsService);
  private readonly roleStatsService = inject(RoleStatisticsService);
  private readonly missionService   = inject(MissionService);
  private readonly fleetService     = inject(FleetService);
  private readonly cdr              = inject(ChangeDetectorRef);
  private readonly zone             = inject(NgZone);

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

  // Missions récentes
  mesMissions: MissionResponse[] = [];
  missionColumns = ['reference', 'destination', 'statut', 'plannedDeparture', 'plannedReturn'];
  loadingMissions = false;

  // Historique pleins carburant
  pleins: PleinCarburantResponse[] = [];
  pleinsColumns = ['fillingDate', 'fuelType', 'quantityLiters', 'totalAmount', 'mileageAfter'];
  loadingPleins = false;

  get isDark() { return this.settings.getThemeColor() === 'dark'; }

  // Taux de missions terminées / total missions
  get tauxMissionsTerminees(): number {
    const total = this.stats.missionsEnCours + this.stats.missionsTerminees;
    if (!total) return 0;
    return Math.round((this.stats.missionsTerminees / total) * 100);
  }

  ngOnInit() {
    this.loadUserName();
    this.loadStats();
    this.loadMissions();
    this.loadPleins();
    this.notifySub = this.settings.notify.subscribe(() => {});
  }

  ngOnDestroy() { this.notifySub.unsubscribe(); }

  loadUserName(): void {
    const raw = localStorage.getItem('tms_access_token');
    if (!raw) return;
    try {
      const tok = JSON.parse(raw);
      const decoded: any = jwtDecode(tok.access_token);
      this.userName = decoded.name ?? decoded.prenom ?? decoded.sub ?? 'Chauffeur';
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

  loadMissions(): void {
    this.loadingMissions = true;
    this.missionService.findMesMissions().subscribe({
      next: missions => this.zone.run(() => {
        this.mesMissions    = missions.slice(0, 8);
        this.loadingMissions = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => { this.loadingMissions = false; this.cdr.detectChanges(); }),
    });
  }

   loadPleins(): void {
    this.loadingPleins = true;
    this.fleetService.getMonChauffeur().subscribe({
      next: (chauffeur) => {
        this.fleetService.getPleinsByChauffeur(chauffeur.id).subscribe({
          next: pleins => this.zone.run(() => {
            this.pleins        = pleins.slice(0, 8);
            this.loadingPleins = false;
            this.cdr.detectChanges();
          }),
          error: () => this.zone.run(() => { this.loadingPleins = false; this.cdr.detectChanges(); }),
        });
      },
      error: () => this.zone.run(() => { this.loadingPleins = false; this.cdr.detectChanges(); }),
    });
  }


  getStatutColor(statut: StatutMission | string): string {
    const map: Record<string, string> = {
      'PLANNED':     '#3b82f6',
      'IN_PROGRESS': '#f59e0b',
      'COMPLETED':   '#10b981',
      'CANCELLED':   '#ef4444',
    };
    return map[statut] ?? '#94a3b8';
  }

  getStatutLabel(statut: StatutMission | string): string {
    const map: Record<string, string> = {
      'PLANNED':     'Planifiée',
      'IN_PROGRESS': 'En cours',
      'COMPLETED':   'Terminée',
      'CANCELLED':   'Annulée',
    };
    return map[statut] ?? String(statut);
  }

  getFuelTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'DIESEL': '⛽ Diesel', 'ESSENCE': '⛽ Essence',
      'GPL': '⛽ GPL', 'ELECTRIQUE': '⚡ Électrique',
    };
    return map[type] ?? type;
  }
}
