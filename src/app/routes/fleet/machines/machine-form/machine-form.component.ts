import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';
import { getEntrepriseId } from 'app/core/authentication/helpers';

@Component({
  selector: 'app-machine-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './machine-form.component.html',
  styleUrls: ['./machine-form.component.scss'],
})
export class MachineFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  machineId?: number;
  loading = false;
  submitted = false;
  private idEntreprise = getEntrepriseId() ?? 0;

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
      reference: ['', Validators.required],
      nom: ['', Validators.required],
      numeroSerie: ['', Validators.required],
      marque: [''],
      modele: [''],
      categorie: [''],
      statut: ['DISPONIBLE', Validators.required],
      heuresActuelles: [0, Validators.min(0)],
      localisation: [''],
      actif: [true],
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.machineId = +id;

        this.fleetService.getMachineById(this.machineId).subscribe({
          next: m => this.form.patchValue({
            reference: m.reference ?? '',
            nom: m.nom,
            numeroSerie: m.numeroSerie ?? '',
            marque: m.marque ?? '',
            modele: m.modele ?? '',
            categorie: m.categorie ?? '',
            statut: m.statut ?? 'DISPONIBLE',
            heuresActuelles: m.heuresActuelles ?? 0,
            localisation: m.localisation ?? '',
            actif: m.actif ?? true,
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

    const request$ = this.isEdit && this.machineId
      ? this.fleetService.saveMachine(payload, this.machineId)
      : this.fleetService.saveMachine(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Machine enregistrée', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/machines']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/machines']);
  }
}