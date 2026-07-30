import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse, MachineResponse } from '../../fleet.service';

@Component({
  selector: 'app-changement-huile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  templateUrl: './changement-huile-form.component.html',
  styleUrls: ['./changement-huile-form.component.scss'],
})
export class ChangementHuileFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  recordId?: number;
  loading = false;
  submitted = false;

  readonly typesHuile = ['MOTEUR_5W30', 'MOTEUR_10W40', 'MOTEUR_15W40', 'HYDRAULIQUE_46', 'HYDRAULIQUE_68', 'TRANSMISSION_80W90'];
  vehicules: VehiculeResponse[] = [];
  machines: MachineResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      reference: [''],
      entityType: ['VEHICLE', Validators.required],
      entityId: [null, Validators.required],
      typeHuile: ['MOTEUR_10W40', Validators.required],
      changeDate: [null, Validators.required],
      mileageAtChange: [null],
      hoursAtChange: [null],
      quantityLiters: [0, [Validators.required, Validators.min(0.1)]],
      unitCost: [0],
      totalCost: [0],
      nextChangeKm: [null],
      nextChangeHours: [null],
      nextChangeDate: [null],
      performedBy: [''],
      notes: [''],
    });

    this.loadEntities();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.recordId = +id;

        this.fleetService.getChangementHuileById(this.recordId).subscribe({
          next: c => this.form.patchValue(c),
          error: () => this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 })
        });
      }
    });
  }

  loadEntities(): void {
    this.fleetService.getVehicules().subscribe(res => {
      this.vehicules = res.content ?? res;
    });
    this.fleetService.getMachines().subscribe(res => {
      this.machines = res.content ?? res;
    });
  }

  get entityType(): string {
    return this.form.get('entityType')?.value;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    const request$ = this.isEdit && this.recordId
      ? this.fleetService.saveChangementHuile(this.form.value, this.recordId)
      : this.fleetService.saveChangementHuile(this.form.value);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Vidange enregistrée', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/changement-huile']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/changement-huile']);
  }
}
