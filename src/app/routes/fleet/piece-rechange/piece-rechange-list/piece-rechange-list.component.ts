import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PieceRechangeResponse } from '../../ordre-travail/ordre-travail.model';
import { OrdreTravailService } from '../../ordre-travail/ordre-travail.service';
import { PieceRechangeFormComponent } from '../piece-rechange-form/piece-rechange-form.component';

@Component({
  selector: 'app-piece-rechange-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatMenuModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    PieceRechangeFormComponent,
  ],
  templateUrl: './piece-rechange-list.component.html',
  styleUrl: './piece-rechange-list.component.scss',
})
export class PieceRechangeListComponent implements OnInit {
  pieces = signal<PieceRechangeResponse[]>([]);
  loading = signal(false);

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  stockFaibleOnly = false;
  searchTerm = '';

  isDialogOpen = false;
  pieceEnEdition: PieceRechangeResponse | null = null;

  constructor(
    private ordreTravailService: OrdreTravailService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    if (this.stockFaibleOnly) {
      this.ordreTravailService.findStockFaible().subscribe({
        next: (list) => {
          this.pieces.set(this.applySearch(list));
          this.totalElements = list.length;
          this.totalPages = 1;
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erreur lors du chargement du stock faible', 'Fermer', { duration: 3000 });
        },
      });
      return;
    }

    this.ordreTravailService.findAllPieces(this.pageIndex, this.pageSize).subscribe({
      next: (page) => {
        this.pieces.set(this.applySearch(page.content));
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des pièces', 'Fermer', { duration: 3000 });
      },
    });
  }

  private applySearch(list: PieceRechangeResponse[]): PieceRechangeResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(p =>
      p.reference.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.minStockQty.toString().includes(term) ||
      p.stockQty.toString().includes(term) ||
      p.unit?.toLowerCase().includes(term) ||
      (p.brand ?? '').toLowerCase().includes(term)
    );
  }

  onSearchChange(): void {
    this.load();
  }

  toggleStockFaible(): void {
    this.stockFaibleOnly = !this.stockFaibleOnly;
    this.pageIndex = 0;
    this.load();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.load();
  }

  isStockFaible(p: PieceRechangeResponse): boolean {
    return p.stockQty <= p.minStockQty;
  }
openCreate(): void {
  console.log('openCreate appelé, isDialogOpen avant:', this.isDialogOpen);
  this.pieceEnEdition = null;
  this.isDialogOpen = true;
  console.log('isDialogOpen après:', this.isDialogOpen);
}

  openEdit(p: PieceRechangeResponse): void {
    this.pieceEnEdition = p;
    this.isDialogOpen = true;
  }

  onDialogClosed(): void {
    this.isDialogOpen = false;
  }

  onPieceSaved(): void {
    this.isDialogOpen = false;
    this.load();
  }

  supprimer(p: PieceRechangeResponse): void {
    const confirmation = window.confirm(`Supprimer définitivement la pièce "${p.name}" ?`);
    if (!confirmation) return;

    this.ordreTravailService.deletePiece(p.id).subscribe({
      next: () => {
        this.pieces.set(this.pieces().filter(x => x.id !== p.id));
        this.snackBar.open('Pièce supprimée', 'Fermer', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(
        err.error?.message ?? 'Erreur lors de la suppression', 'Fermer', { duration: 3000 }
      ),
    });
  }
}