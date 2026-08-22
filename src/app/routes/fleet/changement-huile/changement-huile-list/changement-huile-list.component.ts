import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, ChangementHuileResponse } from '../../fleet.service';

import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';

@Component({
  selector: 'app-changement-huile-list',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, PaginationBarComponent],
  templateUrl: './changement-huile-list.component.html',
  styleUrls: ['./changement-huile-list.component.scss'],
})
export class ChangementHuileListComponent implements OnInit {
  changements: ChangementHuileResponse[] = [];
  loading = false;

  constructor(
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.fleetService.getChangementsHuile().subscribe({
      next: (page: any) => {
        this.changements = page.content ?? page;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goAdd(): void { this.router.navigate(['/fleet/changement-huile/new']); }

  goEdit(c: ChangementHuileResponse): void { this.router.navigate([`/fleet/changement-huile/${c.id}/edit`]); }

  deleteRecord(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vidange ?')) {
      this.fleetService.deleteChangementHuile(id).subscribe({
        next: () => {
          this.snackBar.open('Vidange supprimée', 'Fermer', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
      });
    }
  }

  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = 'changements';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['changements'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

}