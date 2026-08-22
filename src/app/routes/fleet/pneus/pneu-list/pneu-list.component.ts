import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PneuResponse } from '../../fleet.service';

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-pneu-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, PaginationBarComponent],
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

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'pneus';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['pneus'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}