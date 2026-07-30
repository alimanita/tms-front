import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UtilisateurDto } from '../utilisateur.model';
import { UtilisateurService } from '../utilisateur.service';

@Component({
  selector: 'app-liste-utilisateurs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './liste-utilisateur.html',
  styleUrls: ['./liste-utilisateur.scss']
})
export class ListeUtilisateurs implements OnInit {

  utilisateurs:         UtilisateurDto[] = [];
  filteredUtilisateurs: UtilisateurDto[] = [];
  isLoading = true;
  searchText = '';

  currentPage = 1;
  pageSize    = 10;

  userToDelete: UtilisateurDto | null = null;

  constructor(
    private utilisateurService: UtilisateurService,
    private snackBar:           MatSnackBar,
    private router:             Router,
  ) {}

  ngOnInit(): void {
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.utilisateurService.findAll().subscribe({
      next: (res) => {
        this.utilisateurs         = res;
        this.filteredUtilisateurs = [...res];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showError('Impossible de charger les utilisateurs.');
      },
    });
  }

  applyFilter(): void {
    const q = this.searchText.toLowerCase().trim();
    this.filteredUtilisateurs = !q
      ? [...this.utilisateurs]
      : this.utilisateurs.filter(u =>
          u.username?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)    ||
          u.phone?.toLowerCase().includes(q)    ||
          u.entreprise?.nom?.toLowerCase().includes(q)
        );
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUtilisateurs.length / this.pageSize) || 1;
  }

  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get pageEnd(): number {
    return Math.min(this.pageStart + this.pageSize, this.filteredUtilisateurs.length);
  }

  get paginatedUtilisateurs(): UtilisateurDto[] {
    return this.filteredUtilisateurs.slice(this.pageStart, this.pageEnd);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  openAddUtilisateur(): void {
    this.router.navigate(['/users/create']);
  }

  editUtilisateur(id: number): void {
    this.router.navigate(['/users/edit', id]);
  }

  changerMotDePasse(id: number): void {
    this.router.navigate(['/users/change-password', id]);
  }

  confirmDelete(u: UtilisateurDto): void {
    this.userToDelete = u;
  }

  cancelDelete(): void {
    this.userToDelete = null;
  }

  confirmDeleteAction(): void {
    if (!this.userToDelete?.id) return;
    this.utilisateurService.delete(this.userToDelete.id).subscribe({
      next: () => {
        this.showSuccess('Utilisateur supprimé avec succès.');
        this.userToDelete = null;
        this.loadUtilisateurs();
      },
      error: () => {
        this.showError('Erreur lors de la suppression.');
        this.userToDelete = null;
      },
    });
  }

  getInitials(u: UtilisateurDto): string {
    const parts = (u.fullName ?? '').trim().split(/\s+/);
    const first  = (parts[0]?.[0] ?? '').toUpperCase();
    const second = (parts[1]?.[0] ?? '').toUpperCase();
    return (first + second) || '?';
  }

  getAvatarColor(u: UtilisateurDto): string {
    const colors = [
      '#1a6fdb','#7c3aed','#0891b2','#1a9a5e',
      '#d97706','#dc2626','#6366f1','#059669',
    ];
    const str = u.fullName ?? '';
    let hash  = 0;
    for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getRoleClass(roleName?: string): string {
    const map: Record<string, string> = {
      ADMIN:     'role-admin',
      USER:      'role-user',
      MANAGER:   'role-manager',
      COMPTABLE: 'role-comptable',
      VENDEUR:   'role-vendeur',
    };
    return map[roleName ?? ''] ?? 'role-default';
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Fermer', {
      duration: 3000, horizontalPosition: 'end',
      verticalPosition: 'top', panelClass: ['success-snackbar'],
    });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Fermer', {
      duration: 5000, horizontalPosition: 'end',
      verticalPosition: 'top', panelClass: ['error-snackbar'],
    });
  }
}