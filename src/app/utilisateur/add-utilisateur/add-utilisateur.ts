// add-utilisateur.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UtilisateurDto } from '../utilisateur.model';
import { UtilisateurService } from '../utilisateur.service';
import { RoleDto, RolesService } from 'app/roles/roles.service';

@Component({
  selector: 'app-add-utilisateur',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-utilisateur.html',
  styleUrls: ['./add-utilisateur.scss']
})
export class AddUtilisateur implements OnInit {

  utilisateurForm!: FormGroup;
  saving       = false;
  loadingRoles = false;
  loadingUser  = false;

  isEditMode = false;
  utilisateurId: number | null = null;

  rolesDisponibles: RoleDto[] = [];

  showPassword        = false;
  showConfirmPassword = false;

  constructor(
    private fb:                 FormBuilder,
    private utilisateurService: UtilisateurService,
    private rolesService:       RolesService,
    private snackBar:           MatSnackBar,
    private router:             Router,
    private route:               ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!idParam;
    this.utilisateurId = idParam ? Number(idParam) : null;

    this.initForm();
    this.loadRoles();

    if (this.isEditMode && this.utilisateurId) {
      this.loadUtilisateur(this.utilisateurId);
    }
  }

  initForm(): void {
    this.utilisateurForm = this.fb.group({
      username:          ['', Validators.required],
      fullName:          ['', Validators.required],
      email:             ['', [Validators.required, Validators.email]],
      phone:             [''],
      password:          ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: [''],
      active:            [true],
      roles:             [[], Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const pwd     = form.get('password')?.value;
    const confirm = form.get('confirmMotDePasse')?.value;
    if (!pwd && !confirm) return null;
    return pwd === confirm ? null : { passwordMismatch: true };
  }

  loadUtilisateur(id: number): void {
    this.loadingUser = true;
    this.utilisateurService.findById(id).subscribe({
      next: (u) => {
        this.utilisateurForm.patchValue({
          username: u.username,
          fullName: u.fullName,
          email:    u.email,
          phone:    u.phone,
          active:   u.active,
          roles:    (u.roles ?? []).map(r => r.roleName),
        });
        this.loadingUser = false;
      },
      error: () => {
        this.loadingUser = false;
        this.showError("Impossible de charger l'utilisateur.");
      },
    });
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.rolesService.findAll().subscribe({
      next: (data) => {
        this.rolesDisponibles = data;
        if (!this.isEditMode) {
          const userRole = data.find(r => r.roleName === 'USER');
          if (userRole) {
            this.utilisateurForm.get('roles')?.setValue([userRole.roleName]);
          }
        }
        this.loadingRoles = false;
      },
      error: () => {
        this.loadingRoles = false;
        this.showError('Impossible de charger les rôles.');
      },
    });
  }

  isRoleSelected(roleName: string): boolean {
    const roles: string[] = this.utilisateurForm.get('roles')?.value ?? [];
    return roles.includes(roleName);
  }

  toggleRole(roleName: string): void {
    const ctrl  = this.utilisateurForm.get('roles')!;
    const roles: string[] = [...(ctrl.value ?? [])];
    const idx   = roles.indexOf(roleName);
    if (idx >= 0) {
      roles.splice(idx, 1);
    } else {
      roles.push(roleName);
    }
    ctrl.setValue(roles);
    ctrl.markAsTouched();
  }

  getRoleIcon(roleName: string): string {
    const icons: Record<string, string> = {
      ADMIN:     'shield',
      USER:      'person',
      MANAGER:   'manage_accounts',
      COMPTABLE: 'calculate',
      VENDEUR:   'storefront',
    };
    return icons[roleName] ?? 'security';
  }

  onSubmit(): void {
    if (this.utilisateurForm.invalid) {
      this.utilisateurForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const v = this.utilisateurForm.value;

    const utilisateurData: UtilisateurDto = {
      username: v.username,
      fullName: v.fullName,
      email:    v.email,
      phone:    v.phone,
      active:   v.active,
      roles:    v.roles.map((r: string) => ({ roleName: r })),
    };

    if (v.password) {
      utilisateurData.password = v.password;
    }

    const request$ = this.isEditMode && this.utilisateurId
      ? this.utilisateurService.update(this.utilisateurId, utilisateurData)
      : this.utilisateurService.save(utilisateurData);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess(this.isEditMode ? 'Utilisateur modifié avec succès !' : 'Utilisateur créé avec succès !');
        this.router.navigate(['/users']);
      },
      error: (err: any) => {
        this.saving = false;
        const msg = err?.error?.message ?? "Erreur lors de l'enregistrement de l'utilisateur.";
        this.showError(msg);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  get f() { return this.utilisateurForm.controls; }

  isInvalid(field: string): boolean {
    const ctrl = this.utilisateurForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get passwordMismatch(): boolean {
    return this.utilisateurForm.hasError('passwordMismatch')
        && !!this.utilisateurForm.get('confirmMotDePasse')?.touched;
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