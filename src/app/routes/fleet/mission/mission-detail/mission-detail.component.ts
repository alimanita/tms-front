import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MissionService } from '../mission.service';
import { MissionResponse, StatutMission } from '../mission.model';
import { MissionExpensesComponent } from '../mission-expenses/mission-expenses.component';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MissionExpensesComponent,
  ],
  templateUrl: './mission-detail.component.html',
  styleUrls: ['./mission-detail.component.scss'],
})
export class MissionDetailComponent implements OnInit {

  private readonly zone = inject(NgZone);
  private readonly cdr  = inject(ChangeDetectorRef);

  mission: MissionResponse | null = null;
  loading = false;
  readonly statut = StatutMission;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(p => {
      const id = +p['id'];
      if (id) this.load(id);
    });
  }

  load(id: number): void {
    this.loading = true;
    this.missionService.findById(id).subscribe({
      next: (m) => this.zone.run(() => {
        this.mission = m;
        this.loading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement de la mission', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  get isReadonlyExpenses(): boolean {
    return this.mission?.statut === StatutMission.COMPLETED
        || this.mission?.statut === StatutMission.CANCELLED;
  }

  editMission(): void {
    if (!this.mission) return;
    this.router.navigate(['/fleet/missions', this.mission.id, 'edit']);
  }

  demarrer(): void {
    if (!this.mission) return;
    const input = window.prompt('Kilométrage actuel du véhicule au départ (km) :');
    if (input === null) return; // annulé
    const km = input.trim() ? parseFloat(input) : undefined;
    if (km !== undefined && isNaN(km)) {
      this.snackBar.open('Kilométrage invalide', 'Fermer', { duration: 3000 });
      return;
    }
    this.missionService.demarrer(this.mission.id, km).subscribe({
      next: (updated) => this.zone.run(() => {
        this.mission = updated;
        this.snackBar.open('Mission démarrée', 'Fermer', { duration: 2500 });
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(err.error?.message ?? 'Erreur lors du démarrage', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  cloturer(): void {
    if (!this.mission) return;
    const input = window.prompt('Kilométrage actuel du véhicule au retour (km) :');
    if (input === null) return; // annulé
    const km = input.trim() ? parseFloat(input) : undefined;
    if (km !== undefined && isNaN(km)) {
      this.snackBar.open('Kilométrage invalide', 'Fermer', { duration: 3000 });
      return;
    }
    this.missionService.cloturer(this.mission.id, km).subscribe({
      next: (updated) => this.zone.run(() => {
        this.mission = updated;
        this.snackBar.open('Mission clôturée', 'Fermer', { duration: 2500 });
        this.cdr.detectChanges();
      }),
      error: (err) => this.zone.run(() => {
        this.snackBar.open(err.error?.message ?? 'Erreur lors de la clôture', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  annuler(): void {
    if (!this.mission) return;
    const motif = window.prompt("Motif de l'annulation :");
    if (!motif) return;
    this.missionService.annuler(this.mission.id, motif).subscribe({
      next: (updated) => this.zone.run(() => {
        this.mission = updated;
        this.snackBar.open('Mission annulée', 'Fermer', { duration: 2500 });
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.snackBar.open("Erreur lors de l'annulation", 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  retour(): void {
    this.router.navigate(['/fleet/missions']);
  }

  getStatusClass(s: StatutMission): string {
    const map: Record<StatutMission, string> = {
      [StatutMission.PLANNED]: 'status-validee',
      [StatutMission.IN_PROGRESS]: 'status-partiel',
      [StatutMission.COMPLETED]: 'status-livree',
      [StatutMission.CANCELLED]: 'status-annulee',
    };
    return map[s] ?? 'status-validee';
  }

  getStatusLabel(s: StatutMission): string {
    const map: Record<StatutMission, string> = {
      [StatutMission.PLANNED]: 'Planifiée',
      [StatutMission.IN_PROGRESS]: 'En cours',
      [StatutMission.COMPLETED]: 'Terminée',
      [StatutMission.CANCELLED]: 'Annulée',
    };
    return map[s] ?? s;
  }

  formatDateTime(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}