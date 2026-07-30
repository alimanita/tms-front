import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PneuResponse } from '../../fleet.service';

@Component({
  selector: 'app-pneu-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './pneu-list.component.html',
  styleUrls: ['./pneu-list.component.scss'],
})
export class PneuListComponent implements OnInit {
  pneus: PneuResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fleetService.getPneus().subscribe({
      next: (page: any) => {
        this.pneus = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement pneus', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/pneus/new']); }

  goEdit(p: PneuResponse): void { this.router.navigate([`/fleet/pneus/${p.id}/edit`]); }

  toggle(p: PneuResponse): void {
    this.fleetService.togglePneuActif(p.id).subscribe({
      next: () => this.load(),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
    });
  }

  statutClass(statut?: string): string {
    return ({
      STOCK: 'badge--blue',
      MOUNTED: 'badge--green',
      RETREADING: 'badge--orange',
      SCRAP: 'badge--red',
    } as any)[statut ?? ''] ?? 'badge--grey';
  }
}
