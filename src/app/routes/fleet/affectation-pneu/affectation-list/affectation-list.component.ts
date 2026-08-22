import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, AffectationPneuResponse } from '../../fleet.service';

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-affectation-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, PaginationBarComponent],
  templateUrl: './affectation-list.component.html',
  styleUrls: ['./affectation-list.component.scss'],
})
export class AffectationListComponent implements OnInit {
  affectations: AffectationPneuResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fleetService.getAffectationsPneus().subscribe({
      next: (page: any) => {
        this.affectations = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/affectation-pneus/new']); }

  demonter(a: AffectationPneuResponse): void {
    const unmountMileageStr = prompt('Kilométrage actuel lors du démontage ?', (a.mountMileage + 1000).toString());
    if (!unmountMileageStr) return;
    
    const raison = prompt('Raison (ROTATION, WORN, DAMAGED, SEASONAL) ?', 'WORN');
    if (!raison) return;

    this.fleetService.unmountPneu(a.id, parseFloat(unmountMileageStr), raison).subscribe({
      next: () => {
        this.snackBar.open('Pneu démonté avec succès', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Erreur lors du démontage', 'Fermer', { duration: 3000 })
    });
  }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'affectations';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['affectations'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}