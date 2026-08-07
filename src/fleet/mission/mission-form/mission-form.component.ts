import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MissionService } from '../mission.service';
import { MissionRequest } from '../mission.model';
import { FleetService, VehiculeResponse } from '../../fleet.service';

@Component({
  selector: 'app-mission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './mission-form.component.html',
  styleUrls: ['./mission-form.component.scss'],
})
export class MissionFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  missionId?: number;
  loading = false;
  submitted = false;

  vehicules: VehiculeResponse[] = [];
  // ⚠️ Chauffeur : nom et prenom sont deux champs séparés côté backend
  chauffeurs: { id: number; nom: string; prenom: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private missionService: MissionService,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title:             ['', [Validators.required, Validators.maxLength(200)]],
      clientId:          [null],
      vehiculeId:        [null, Validators.required],
      chauffeurId:       [null, Validators.required],
      departureLocation: ['', Validators.required],
      arrivalLocation:   ['', Validators.required],
      plannedDeparture:  ['', Validators.required],
      plannedReturn:     [''],
      purpose:           [''],
      cargoDescription:  [''],
      cargoWeight:       [null, Validators.min(0)],
      notes:             [''],
      revenue:           [null, [Validators.min(0)]],
    });

    this.loadVehicules();
    this.loadChauffeurs();

    this.route.params.subscribe(p => {
      if (p['id']) {
        this.isEdit    = true;
        this.missionId = +p['id'];
        this.loadMission(this.missionId);
      }
    });
  }

  private loadVehicules(): void {
    this.fleetService.getVehicules().subscribe({
      next: (page: any) => this.vehicules = page.content ?? page,
      error: () => this.snackBar.open('Erreur chargement véhicules', 'Fermer', { duration: 3000 })
    });
  }

  private loadChauffeurs(): void {
    this.fleetService.getChauffeurs().subscribe({
      next: (page: any) => this.chauffeurs = page.content ?? page,
      error: () => this.snackBar.open('Erreur chargement chauffeurs', 'Fermer', { duration: 3000 })
    });
  }

  private loadMission(id: number): void {
    this.missionService.findById(id).subscribe({
      next: m => this.form.patchValue({
        title:             (m as any).title ?? '',
        clientId:          (m as any).clientId ?? null,
        vehiculeId:        m.vehiculeId,
        chauffeurId:       m.chauffeurId,
        departureLocation: (m as any).departureLocation ?? '',
        arrivalLocation:   (m as any).arrivalLocation ?? m.destination ?? '',
        plannedDeparture:  m.plannedDeparture?.slice(0, 16),
        plannedReturn:     m.plannedReturn?.slice(0, 16),
        purpose:           (m as any).purpose ?? m.motif ?? '',
        cargoDescription:  (m as any).cargoDescription ?? '',
        cargoWeight:       (m as any).cargoWeight ?? null,
        notes:             (m as any).notes ?? '',
        revenue:           m.revenue ?? null,
      }),
      error: () => this.snackBar.open('Erreur chargement mission', 'Fermer', { duration: 3000 })
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const fv = this.form.value;

    const request: MissionRequest = {
      title:             fv.title,
      clientId:          fv.clientId || undefined,
      vehiculeId:        fv.vehiculeId,
      chauffeurId:       fv.chauffeurId,
      departureLocation: fv.departureLocation,
      arrivalLocation:   fv.arrivalLocation,
      plannedDeparture:  fv.plannedDeparture,
      plannedReturn:     fv.plannedReturn || undefined,
      purpose:           fv.purpose || undefined,
      cargoDescription:  fv.cargoDescription || undefined,
      cargoWeight:       fv.cargoWeight ?? undefined,
      notes:             fv.notes || undefined,
      revenue:           fv.revenue ?? undefined,
    };

    const req$ = this.isEdit && this.missionId
      ? this.missionService.update(this.missionId, request)
      : this.missionService.create(request);

    req$.subscribe({
      next: () => {
        this.snackBar.open('Mission enregistrée', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/missions']);
      },
      error: (err) => {
        console.error('Erreur sauvegarde mission', err);
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/missions']);
  }
}