import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, MachineResponse } from '../../fleet.service';
import { UpdateMachineHoursDialogComponent } from '../update-machine-hours/update-machine-hours-dialog';

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, UpdateMachineHoursDialogComponent, PaginationBarComponent],
  templateUrl: './machine-list.component.html',
  styleUrls: ['./machine-list.component.scss'],
})
export class MachineListComponent implements OnInit {
  machines = signal<MachineResponse[]>([]);
  loading  = signal(false);

  // ── Panneau mise à jour des heures ──────────────────────────
  isHoursDialogOpen = false;
  selectedMachine: MachineResponse | undefined;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.fleetService.getMachines().subscribe({
      next: (page: any) => {
        this.machines.set(page.content ?? page);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur chargement machines', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/machines/new']); }

  goEdit(m: MachineResponse): void { this.router.navigate([`/fleet/machines/${m.id}/edit`]); }

  toggle(m: MachineResponse): void {
    this.fleetService.toggleMachineActif(m.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  statutClass(statut?: string): string {
    return ({
      DISPONIBLE:   'badge--green',
      EN_SERVICE:   'badge--blue',
      HORS_SERVICE: 'badge--red',
    } as any)[statut ?? ''] ?? 'badge--grey';
  }

  goMaintenance(m: MachineResponse): void {
    this.router.navigate([`/fleet/machines/${m.id}/maintenance`]);
  }

  goStatsSyage(m: MachineResponse): void {
    this.router.navigate([`/fleet/machines/${m.id}/stats-syage`]);
  }

  // ── Heures ───────────────────────────────────────────────────
  openHoursDialog(m: MachineResponse): void {
    this.selectedMachine    = m;
    this.isHoursDialogOpen  = true;
  }

  onHoursDialogClosed(): void {
    this.isHoursDialogOpen = false;
    this.selectedMachine   = undefined;
  }

  onHoursUpdated(): void {
    this.isHoursDialogOpen = false;
    this.selectedMachine   = undefined;
    this.snackBar.open('Heures mises à jour', 'OK', { duration: 3000 });
    this.load();
  }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'machines';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['machines'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}