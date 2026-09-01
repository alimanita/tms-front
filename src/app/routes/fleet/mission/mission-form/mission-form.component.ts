import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MissionService } from '../mission.service';
import { MissionRequest } from '../mission.model';
import { FleetService, VehiculeResponse } from '../../fleet.service';
import { PartenaireService } from '../../partenaire/partenaire.service';
import { SocietePartenaireResponse } from '../../partenaire/partenaire.model';

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
  partenaires: SocietePartenaireResponse[] = [];
  letterFile: File | null = null;

  // IA extraction
  aiFile: File | null = null;
  aiPreviewUrl: string | null = null;
  aiLoading = false;

  get isSubcontracted(): boolean {
    return this.form?.get('modeExecution')?.value === 'SUBCONTRACTED';
  }

  constructor(
    private fb: FormBuilder,
    private missionService: MissionService,
    private fleetService: FleetService,
    private partenaireService: PartenaireService,
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
      modeExecution:     ['INTERNAL'],
      vehiculeId:        [null],
      chauffeurIds:      [[]],
      partenaireId:      [null],
      tauxCommission:    [null],
      externeCamion:     [''],
      externeChauffeur:  [''],
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
    this.loadPartenaires();

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

  private loadPartenaires(): void {
    this.partenaireService.findAllActive().subscribe({
      next: (list) => this.partenaires = list,
      error: () => this.snackBar.open('Erreur chargement partenaires', 'Fermer', { duration: 3000 })
    });
  }

  private loadMission(id: number): void {
    this.missionService.findById(id).subscribe({
      next: m => this.form.patchValue({
        title:             (m as any).title ?? '',
        clientId:          (m as any).clientId ?? null,
        modeExecution:     m.modeExecution ?? 'INTERNAL',
        vehiculeId:        m.vehiculeId,
        chauffeurIds:      m.chauffeurIds,
        partenaireId:      m.partenaireId ?? null,
        tauxCommission:    m.tauxCommission ?? null,
        externeCamion:     m.externeCamion ?? '',
        externeChauffeur:  m.externeChauffeur ?? '',
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
      modeExecution:     fv.modeExecution,
      vehiculeId:        fv.vehiculeId || undefined,
      chauffeurIds:      fv.chauffeurIds || [],
      partenaireId:      fv.partenaireId || undefined,
      tauxCommission:    fv.tauxCommission ?? undefined,
      externeCamion:     fv.externeCamion || undefined,
      externeChauffeur:  fv.externeChauffeur || undefined,
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

  onAiFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.aiFile = file;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => (this.aiPreviewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.aiPreviewUrl = null;
    }
    // reset input so same file can be re-selected
    (event.target as HTMLInputElement).value = '';
  }

  removeAiFile(): void {
    this.aiFile = null;
    this.aiPreviewUrl = null;
  }

  extractData(): void {
    if (!this.aiFile) return;
    this.aiLoading = true;
    this.snackBar.open("L'IA analyse votre document...", '', { duration: 4000 });
    this.missionService.extractMissionData(this.aiFile).subscribe({
      next: (data) => {
        this.aiLoading = false;
        this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        const patch: any = {};
        if (data.title)             patch.title             = data.title;
        if (data.departureLocation) patch.departureLocation = data.departureLocation;
        if (data.arrivalLocation)   patch.arrivalLocation   = data.arrivalLocation;
        if (data.plannedDeparture)  patch.plannedDeparture  = data.plannedDeparture.slice(0, 16);
        if (data.plannedReturn)     patch.plannedReturn     = data.plannedReturn.slice(0, 16);
        if (data.revenue != null)   patch.revenue           = data.revenue;
        if (data.cargoDescription)  patch.cargoDescription  = data.cargoDescription;
        if (data.notes)             patch.notes             = data.notes;
        this.form.patchValue(patch);
      },
      error: () => {
        this.aiLoading = false;
        this.snackBar.open("Erreur lors de l'extraction IA", 'Fermer', { duration: 5000 });
      }
    });
  }
}