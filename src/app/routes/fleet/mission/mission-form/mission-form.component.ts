import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MissionService } from '../mission.service';
import { MissionRequest } from '../mission.model';
import { FleetService, VehiculeResponse } from '../../fleet.service';

@Component({
  selector: 'app-mission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './mission-form.component.html',
  styleUrls: ['./mission-form.component.scss'],
})
export class MissionFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  missionId?: number;
  loading = false;
  submitted = false;
  errorMessage: string | null = null;
  errorDetails: string[] = [];
  chauffeurDropdownOpen = false;

  vehicules: VehiculeResponse[] = [];
  chauffeurs: { id: number; nom: string; prenom: string }[] = [];
  letterFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private missionService: MissionService,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private el: ElementRef,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const wrapper = this.el.nativeElement.querySelector('.chauffeur-dropdown-wrapper');
    if (wrapper && !wrapper.contains(event.target as Node)) {
      this.chauffeurDropdownOpen = false;
    }
  }

  private getNowDateTimeLocal(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  get selectedChauffeursLabel(): string {
    const ids: number[] = this.form?.get('chauffeurIds')?.value || [];
    if (ids.length === 0) return '— Sélectionner des chauffeurs —';
    const names = this.chauffeurs
      .filter(c => ids.includes(c.id))
      .map(c => `${c.prenom} ${c.nom}`);
    if (names.length === 1) return names[0];
    return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '');
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      title:             ['', [Validators.required, Validators.maxLength(200)]],
      clientId:          [null],
      vehiculeId:        [null, Validators.required],
      chauffeurIds:      [[], Validators.required],
      departureLocation: ['', Validators.required],
      arrivalLocation:   ['', Validators.required],
      plannedDeparture:  [this.getNowDateTimeLocal(), Validators.required],
      purpose:           [''],
      cargoDescription:  [''],
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
    this.fleetService.getVehicules({ size: 1000 }).subscribe({
      next: (page: any) => this.vehicules = page.content ?? page,
      error: () => this.snackBar.open('Erreur chargement vehicules', 'Fermer', { duration: 3000 })
    });
  }

  private loadChauffeurs(): void {
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe({
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
        chauffeurIds:      m.chauffeurIds,
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

  onLetterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.letterFile = input.files?.[0] ?? null;
  }

  removeLetterFile(): void {
    this.letterFile = null;
    const input = document.getElementById('letterInput') as HTMLInputElement | null;
    if (input) input.value = '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.errorDetails = [];
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
      chauffeurIds:      fv.chauffeurIds,
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
      ? this.missionService.update(this.missionId, request, this.letterFile ?? undefined)
      : this.missionService.create(request, this.letterFile ?? undefined);

    req$.subscribe({
      next: () => {
        this.snackBar.open('Mission enregistree avec succes', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/missions']);
      },
      error: (err) => {
        this.loading = false;
        const body = err?.error;
        const code = body?.code;
        const status = err?.status;

        if (code === 'VALIDATION_ERROR' && body?.errors?.length > 0) {
          this.errorMessage = 'Le formulaire contient des erreurs de validation :';
          this.errorDetails = body.errors.map((e: string) => {
            const parts = e.split(': ');
            return parts.length > 1 ? parts.slice(1).join(': ') : e;
          });
        } else if (code === 'INVALID_OPERATION' && body?.detail) {
          this.errorMessage = body.detail;
          this.errorDetails = [];
        } else if (code === 'ENTITY_NOT_FOUND' || status === 404) {
          this.errorMessage = 'La ressource demandee est introuvable.';
          this.errorDetails = [];
        } else if (status === 403) {
          this.errorMessage = "Vous n'avez pas les droits pour effectuer cette action.";
          this.errorDetails = [];
        } else if (status === 500) {
          this.errorMessage = 'Une erreur interne est survenue sur le serveur.';
          this.errorDetails = [];
        } else if (body?.title && body.title !== 'Internal Server Error') {
          this.errorMessage = body.title;
          this.errorDetails = [];
        } else {
          this.errorMessage = "Une erreur est survenue lors de l'enregistrement. Veuillez reessayer.";
          this.errorDetails = [];
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/missions']);
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.chauffeurDropdownOpen = !this.chauffeurDropdownOpen;
  }

  toggleChauffeur(id: number): void {
    const current = this.form.get('chauffeurIds')?.value as number[] || [];
    const index = current.indexOf(id);
    if (index >= 0) {
      this.form.patchValue({ chauffeurIds: current.filter(x => x !== id) });
    } else {
      this.form.patchValue({ chauffeurIds: [...current, id] });
    }
  }

  isChauffeurSelected(id: number): boolean {
    const current = this.form.get('chauffeurIds')?.value as number[] || [];
    return current.includes(id);
  }
}