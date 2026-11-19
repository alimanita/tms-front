import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
  private readonly sanitizer = inject(DomSanitizer);

  mission: MissionResponse | null = null;
  loading = false;
  readonly statut = StatutMission;

  // ── Modal Document (Lettre / CMR) ──────────────────────────────────
  docModalOpen  = false;
  docModalTitle = 'Document';
  docLoading    = false;
  docIsImage    = false;
  docSafeUrl: SafeUrl | null = null;
  private docBlobUrl: string | null = null;
  private currentDocType: 'LETTER' | 'CMR' = 'LETTER';

  uploadingDoc = false;

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

  // ── Documents (Lettre & CMR) ──────────────────────────────────────

  viewLetter(): void {
    if (!this.mission?.letterMissionUrl) return;
    this.currentDocType = 'LETTER';
    this.docModalTitle = 'Lettre de mission';
    this.docModalOpen = true;
    this.docLoading = true;

    this.missionService.downloadLetterBlob(this.mission.id).subscribe({
      next: (blob) => this.zone.run(() => {
        const contentType = blob.type || 'application/octet-stream';
        this.docIsImage = contentType.startsWith('image/');
        if (this.docBlobUrl) window.URL.revokeObjectURL(this.docBlobUrl);
        const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
        this.docBlobUrl = url;
        this.docSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.docLoading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.docLoading = false;
        this.docModalOpen = false;
        this.snackBar.open('Impossible de charger la lettre de mission', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  downloadLetter(): void {
    if (!this.mission?.letterMissionUrl) return;
    this.missionService.downloadLetterBlob(this.mission.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lettre_Mission_${this.mission?.reference || this.mission?.id}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors du téléchargement de la lettre', 'Fermer', { duration: 3000 })
    });
  }

  viewCmr(): void {
    if (!this.mission?.cmrUrl) return;
    this.currentDocType = 'CMR';
    this.docModalTitle = 'Document CMR (Lettre de voiture)';
    this.docModalOpen = true;
    this.docLoading = true;

    this.missionService.downloadCmrBlob(this.mission.id).subscribe({
      next: (blob) => this.zone.run(() => {
        const contentType = blob.type || 'application/octet-stream';
        this.docIsImage = contentType.startsWith('image/');
        if (this.docBlobUrl) window.URL.revokeObjectURL(this.docBlobUrl);
        const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
        this.docBlobUrl = url;
        this.docSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.docLoading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.docLoading = false;
        this.docModalOpen = false;
        this.snackBar.open('Impossible de charger le document CMR', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  downloadCmr(): void {
    if (!this.mission?.cmrUrl) return;
    this.missionService.downloadCmrBlob(this.mission.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CMR_${this.mission?.reference || this.mission?.id}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors du téléchargement du CMR', 'Fermer', { duration: 3000 })
    });
  }

  downloadCurrentDoc(): void {
    if (this.currentDocType === 'CMR') {
      this.downloadCmr();
    } else {
      this.downloadLetter();
    }
  }

  closeDocModal(): void {
    this.docModalOpen = false;
    if (this.docBlobUrl) {
      window.URL.revokeObjectURL(this.docBlobUrl);
      this.docBlobUrl = null;
    }
    this.docSafeUrl = null;
  }

  onLetterFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file || !this.mission) return;
    this.uploadingDoc = true;
    this.missionService.uploadLetter(this.mission.id, file).subscribe({
      next: (m) => this.zone.run(() => {
        this.mission = m;
        this.uploadingDoc = false;
        this.snackBar.open('Lettre de mission attachée avec succès', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.uploadingDoc = false;
        this.snackBar.open('Erreur lors de l’envoi de la lettre de mission', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }

  onCmrFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file || !this.mission) return;
    this.uploadingDoc = true;
    this.missionService.uploadCmr(this.mission.id, file).subscribe({
      next: (m) => this.zone.run(() => {
        this.mission = m;
        this.uploadingDoc = false;
        this.snackBar.open('Document CMR attaché avec succès', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.uploadingDoc = false;
        this.snackBar.open('Erreur lors de l’envoi du CMR', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }),
    });
  }
}
