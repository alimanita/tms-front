import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RolesService, RoleDto } from './roles.service';
import { PaginationBarComponent, PageChangeEvent } from '../shared/components/pagination-bar/pagination-bar.component';
import { PaginatePipe } from '../shared/pipes/paginate.pipe';

@Component({
  selector: 'app-settings-settings-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PaginationBarComponent,
    PaginatePipe
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class SettingsSettingsRoles implements OnInit {

  // ── Liste ──────────────────────────────────────────────────
  roles: RoleDto[]         = [];
  filteredRoles: RoleDto[] = [];
  isLoading                = false;
  searchText               = '';
  
  pageIndex = 0;
  pageSize = 10;

  // ── Formulaire ajout ───────────────────────────────────────
  showAddPanel    = false;
  isSaving        = false;
  newRoleName     = '';
  submitted       = false;

  // ── Suppression ────────────────────────────────────────────
  deletingId: number | null = null;

  // ── Préfixes suggérés ─────────────────────────────────────
  readonly suggestions = [
    'ADMIN', 'MANAGER', 'USER', 'SUPERADMIN',
    'COMPTABLE', 'VENDEUR', 'LIVREUR', 'TECHNICIEN'
  ];

  constructor(
    private rolesService: RolesService,
    private snackBar: MatSnackBar,
      private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  // ── Chargement ────────────────────────────────────────────

loadRoles(): void {
  this.isLoading = true;
  this.rolesService.findAll().subscribe({
    next: (data) => {
      this.roles         = data || [];
      this.filteredRoles = [...this.roles];
      this.isLoading     = false;
      this.applySearch();
      this.cdr.detectChanges();     // ✅ forcer après chargement
    },
    error: () => {
      this.isLoading = false;
      this.cdr.detectChanges();     // ✅ forcer aussi en cas d'erreur
      this.snackBar.open('Erreur chargement des rôles', 'Fermer', { duration: 3000 });
    }
  });
}

  // ── Recherche ─────────────────────────────────────────────

  applySearch(): void {
    const q = this.searchText.toLowerCase().trim();
    this.filteredRoles = q
      ? this.roles.filter(r => r.roleName.toLowerCase().includes(q))
      : [...this.roles];
    this.pageIndex = 0;
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  onPageChange(event: PageChangeEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // ── Ajout ─────────────────────────────────────────────────

  openAddPanel(): void {
    this.showAddPanel = true;
    this.newRoleName  = '';
    this.submitted    = false;
  }

  closeAddPanel(): void {
    this.showAddPanel = false;
    this.newRoleName  = '';
    this.submitted    = false;
  }

  applySuggestion(name: string): void {
    this.newRoleName = name;
  }

  // ✅ Normaliser le nom avant affichage dans l'input
get previewRoleName(): string {
  return this.newRoleName.trim().toUpperCase();
}

saveRole(): void {
  this.submitted = true;

  if (!this.newRoleName.trim()) {
    this.snackBar.open('Le nom du rôle est obligatoire', 'Fermer', { duration: 3000 });
    return;
  }

  this.isSaving = true;
  const dto: RoleDto = { roleName: this.newRoleName.trim() };

  this.rolesService.save(dto).subscribe({
next: (created) => {
  this.isSaving = false;
  this.closeAddPanel();
  this.loadRoles();
  this.cdr.detectChanges();         // ✅ forcer la mise à jour
  this.snackBar.open(
    `✅ Rôle "${created.roleName}" créé avec succès`,
    'Fermer',
    { duration: 3000, panelClass: ['snack-success'] }
  );
},
error: (err) => {
  this.isSaving = false;
  this.cdr.detectChanges();         // ✅ forcer aussi en cas d'erreur
  const msg =
    err?.error?.message ||
    err?.error?.errors?.[0] ||
    (typeof err?.error === 'string' ? err.error : null) ||
    err?.message ||
    'Une erreur est survenue';
  this.snackBar.open(
    `❌ ${msg}`,
    'Fermer',
    { duration: 6000, panelClass: ['snack-error'] }
  );
}
  });
}

  // ── Suppression ───────────────────────────────────────────

deleteRole(role: RoleDto): void {
  if (!role.id) return;
  if (!confirm(`Supprimer le rôle "${role.roleName}" ?`)) return;

  this.deletingId = role.id;

  this.rolesService.delete(role.id).subscribe({
    next: () => {
      this.roles         = this.roles.filter(r => r.id !== role.id);
      this.filteredRoles = this.filteredRoles.filter(r => r.id !== role.id);
      this.deletingId    = null;
      this.cdr.detectChanges();     // ✅ forcer la mise à jour
      this.snackBar.open(
        `✅ Rôle "${role.roleName}" supprimé`,
        'Fermer',
        { duration: 3000, panelClass: ['snack-success'] }
      );
    },
    error: (err) => {
      this.deletingId = null;
      this.cdr.detectChanges();     // ✅ forcer aussi en cas d'erreur
      const msg =
        err?.error?.message ||
        err?.error?.errors?.[0] ||
        (typeof err?.error === 'string' ? err.error : null) ||
        err?.message ||
        'Impossible de supprimer ce rôle';
      this.snackBar.open(
        `❌ ${msg}`,
        'Fermer',
        { duration: 6000, panelClass: ['snack-error'] }
      );
    }
  });
}

  // ── Utilitaires ───────────────────────────────────────────

  getRoleColor(roleName: string): string {
    const map: Record<string, string> = {
      ROLE_SUPERADMIN: 'role-color--red',
      ROLE_ADMIN:      'role-color--purple',
      ROLE_MANAGER:    'role-color--blue',
      ROLE_USER:       'role-color--green',
      ROLE_VENDEUR:    'role-color--orange',
      ROLE_COMPTABLE:  'role-color--teal',
      ROLE_LIVREUR:    'role-color--amber',
    };
    return map[roleName] ?? 'role-color--gray';
  }

  getRoleInitial(roleName: string): string {
    const name = roleName.replace('ROLE_', '');
    return name.charAt(0).toUpperCase();
  }

  getRoleLabel(roleName: string): string {
    return roleName.replace('ROLE_', '');
  }
}