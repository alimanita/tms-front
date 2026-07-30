import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';
import { getEntrepriseId } from 'app/core/authentication/helpers';

export interface UtilisateurLite {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-chauffeur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  templateUrl: './chauffeur-form.component.html',
  styleUrls: ['./chauffeur-form.component.scss'],
})
export class ChauffeurFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  chauffeurId?: number;
  loading = false;
  submitted = false;
  private idEntreprise = getEntrepriseId() ?? 0;

  readonly statuts = ['DISPONIBLE', 'EN_MISSION', 'INDISPONIBLE'];

  // ── Comptes utilisateurs (rôle CHAUFFEUR) ─────────────────────────────────
  utilisateursDisponibles: UtilisateurLite[] = [];
  loadingUtilisateurs = false;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

ngOnInit(): void {
  this.form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    telephone: [''],
    email: ['', Validators.email],
    numeroPermis: [''],
    dateExpirationPermis: [null],
    statut: ['DISPONIBLE', Validators.required],
    actif: [true],
    idUtilisateur: [null],
  });

  this.loadUtilisateursDisponibles();

  // ── Auto-remplissage nom/prenom/email depuis le compte sélectionné ──────
  this.form.get('idUtilisateur')?.valueChanges.subscribe((idUtilisateur: number | null) => {
    this.onUtilisateurSelected(idUtilisateur);
  });

  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.isEdit = true;
      this.chauffeurId = +id;

      this.fleetService.getChauffeurById(this.chauffeurId).subscribe({
        next: c => this.form.patchValue({
          nom: c.nom,
          prenom: c.prenom,
          telephone: c.telephone ?? '',
          email: c.email ?? '',
          numeroPermis: c.numeroPermis ?? '',
          dateExpirationPermis: c.dateExpirationPermis ?? null,
          statut: c.statut ?? 'DISPONIBLE',
          actif: c.actif ?? true,
          idUtilisateur: c.idUtilisateur ?? null,
        }),
        error: () => this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 })
      });
    }
  });
}

// ── Auto-remplit nom/prenom/email depuis l'utilisateur sélectionné ────────
onUtilisateurSelected(idUtilisateur: number | null): void {
  if (idUtilisateur == null) {
    return;
  }

  const utilisateur = this.utilisateursDisponibles.find(u => u.id === idUtilisateur);
  if (!utilisateur) {
    return;
  }

  const fullName = (utilisateur.fullName ?? '').trim();
  const idx = fullName.indexOf(' ');
  const prenom = idx > 0 ? fullName.substring(0, idx) : fullName;
  const nom = idx > 0 ? fullName.substring(idx + 1).trim() : '';

  this.form.patchValue({
    nom: nom || this.form.get('nom')?.value,
    prenom: prenom || this.form.get('prenom')?.value,
    email: utilisateur.email ?? this.form.get('email')?.value,
    telephone: utilisateur.phone ?? this.form.get('telephone')?.value,
  }, { emitEvent: false });
}

  // ── Charge les utilisateurs ayant le rôle CHAUFFEUR pour cette entreprise ──
  loadUtilisateursDisponibles(): void {
    this.loadingUtilisateurs = true;
    this.fleetService.getUtilisateursByRole('CHAUFFEUR', this.idEntreprise).subscribe({
      next: (data: UtilisateurLite[]) => {
        this.utilisateursDisponibles = data;
        this.loadingUtilisateurs = false;
      },
      error: () => {
        this.loadingUtilisateurs = false;
        this.snackBar.open('Impossible de charger les comptes utilisateurs', 'Fermer', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    const payload = {
      ...this.form.value,
      idEntreprise: this.idEntreprise
    };

    const request$ = this.isEdit && this.chauffeurId
      ? this.fleetService.saveChauffeur(payload, this.chauffeurId)
      : this.fleetService.saveChauffeur(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Chauffeur enregistré', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/chauffeurs']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/chauffeurs']);
  }
}