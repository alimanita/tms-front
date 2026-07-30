import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';
import { getEntrepriseId } from 'app/core/authentication/helpers';


@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.scss'],
})
export class VehicleFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  vehiculeId?: number;
  loading = false;
  submitted = false;
  private idEntreprise = getEntrepriseId() ?? 0;

  readonly carburants = ['DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE'];
  readonly statuts = ['DISPONIBLE', 'EN_SERVICE', 'HORS_SERVICE'];

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      immatriculation: ['', Validators.required],
      marque: [''],
      modele: [''],
      annee: [new Date().getFullYear()],
      typeCarburant: ['DIESEL', Validators.required],
      statut: ['DISPONIBLE', Validators.required],
      kilometrageActuel: [0, Validators.min(0)],
      capaciteReservoir: [null, Validators.min(0)],
      actif: [true],
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.vehiculeId = +id;

        this.fleetService.getVehiculeById(this.vehiculeId).subscribe({
          next: v => this.form.patchValue({
            immatriculation: v.immatriculation,
            marque: v.marque ?? '',
            modele: v.modele ?? '',
            annee: v.annee ?? new Date().getFullYear(),
            typeCarburant: v.typeCarburant ?? 'DIESEL',
            statut: v.statut ?? 'DISPONIBLE',
            kilometrageActuel: v.kilometrageActuel ?? 0,
            capaciteReservoir: v.capaciteReservoir ?? null,
            actif: v.actif ?? true,
          }),
          error: () => this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 })
        });
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

    const request$ = this.isEdit && this.vehiculeId
      ? this.fleetService.saveVehicule(payload, this.vehiculeId)
      : this.fleetService.saveVehicule(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Véhicule enregistré', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/vehicules']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/vehicules']);
  }
}