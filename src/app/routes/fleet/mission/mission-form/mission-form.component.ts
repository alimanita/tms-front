import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { FleetService } from '../../fleet.service';
import { MissionService } from '../mission.service';
import { PartenaireService } from '../../partenaire/partenaire.service';
import { MissionRequest, ChauffeurSlot } from '../mission.model';

@Component({
  selector: 'app-mission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './mission-form.component.html',
  styleUrls: ['./mission-form.component.scss']
})
export class MissionFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  missionId?: number;
  loading = false;
  submitted = false;

  vehicules: any[] = [];
  chauffeurs: any[] = [];
  partenaires: any[] = [];
  
  chauffeurSlots: ChauffeurSlot[] = [];
  selectedChauffeurToAdd: number | null = null;

  letterFile: File | null = null;

  aiFile: File | null = null;
  aiPreviewUrl: string | null = null;
  aiLoading = false;

  errorMessage: string | null = null;
  errorDetails: string[] = [];

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

  private getNowDateTimeLocal(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      title:             ['', [Validators.required, Validators.maxLength(200)]],
      clientId:          [null],
      modeExecution:     ['INTERNAL'],
      vehiculeId:        [null],
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
      next: (m: any) => {
        this.form.patchValue({
          title:             m.title ?? '',
          clientId:          m.clientId ?? null,
          modeExecution:     m.modeExecution ?? 'INTERNAL',
          vehiculeId:        m.vehiculeId,
          partenaireId:      m.partenaireId ?? null,
          tauxCommission:    m.tauxCommission ?? null,
          externeCamion:     m.externeCamion ?? '',
          externeChauffeur:  m.externeChauffeur ?? '',
          departureLocation: m.departureLocation ?? '',
          arrivalLocation:   m.arrivalLocation ?? m.destination ?? '',
          plannedDeparture:  m.plannedDeparture?.slice(0, 16),
          plannedReturn:     m.plannedReturn?.slice(0, 16),
          purpose:           m.purpose ?? m.motif ?? '',
          cargoDescription:  m.cargoDescription ?? '',
          cargoWeight:       m.cargoWeight ?? null,
          notes:             m.notes ?? '',
          revenue:           m.revenue ?? null,
        });
        
        // Charger les créneaux chauffeurs
        if (m.chauffeurs && Array.isArray(m.chauffeurs)) {
           this.chauffeurSlots = m.chauffeurs.map((c: any) => ({
             chauffeurId: c.chauffeurId,
             nom: c.nom,
             // Formater les dates pour les input datetime-local si nécessaire (ou garder ISO complet)
             heureDebut: c.heureDebut ? c.heureDebut.slice(0, 16) : undefined,
             heureFin: c.heureFin ? c.heureFin.slice(0, 16) : undefined
           }));
        }
      },
      error: () => this.snackBar.open('Erreur chargement mission', 'Fermer', { duration: 3000 })
    });
  }
  
  addChauffeur(): void {
    if (!this.selectedChauffeurToAdd) return;
    
    // Vérifier si déjà ajouté
    if (this.chauffeurSlots.some(s => s.chauffeurId == this.selectedChauffeurToAdd)) {
        this.snackBar.open('Ce chauffeur est déjà ajouté.', 'Fermer', { duration: 3000 });
        return;
    }
    
    const c = this.chauffeurs.find(x => x.id == this.selectedChauffeurToAdd);
    if (c) {
        // Auto-remplir heureDebut = heureFin du slot précédent
        let autoDebut: string | undefined = undefined;
        if (this.chauffeurSlots.length > 0) {
            const prev = this.chauffeurSlots[this.chauffeurSlots.length - 1];
            if (prev.heureFin) {
                autoDebut = prev.heureFin;
            }
        }
        this.chauffeurSlots.push({ chauffeurId: c.id, nom: `${c.prenom} ${c.nom}`, heureDebut: autoDebut });
        this.selectedChauffeurToAdd = null;
    }
  }
  
  removeChauffeur(index: number): void {
      this.chauffeurSlots.splice(index, 1);
  }

  /** Quand la Fin d'un slot change, met à jour le Début du slot suivant */
  onFinChanged(index: number): void {
      const current = this.chauffeurSlots[index];
      const next = this.chauffeurSlots[index + 1];
      if (next && current.heureFin) {
          next.heureDebut = current.heureFin;
      }
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
    
    // Formater les dates des slots pour envoyer ISO avec secondes
    const formattedSlots = this.chauffeurSlots.map(s => ({
        ...s,
        heureDebut: s.heureDebut ? (s.heureDebut.length === 16 ? s.heureDebut + ':00' : s.heureDebut) : undefined,
        heureFin: s.heureFin ? (s.heureFin.length === 16 ? s.heureFin + ':00' : s.heureFin) : undefined,
    }));

    const request: MissionRequest = {
      title:             fv.title,
      clientId:          fv.clientId || undefined,
      modeExecution:     fv.modeExecution,
      vehiculeId:        fv.vehiculeId || undefined,
      chauffeurs:        formattedSlots,
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

  onAiFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.aiFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.aiPreviewUrl = e.target?.result as string;
      reader.readAsDataURL(this.aiFile);
    }
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
        this.snackBar.open('Donnees extraites avec succes !', 'Fermer', { duration: 3000 });
        const patch: any = {};
        if (data.title)             patch.title             = data.title;
        if (data.departureLocation) patch.departureLocation = data.departureLocation;
        if (data.arrivalLocation)   patch.arrivalLocation   = data.arrivalLocation;
        if (data.plannedDeparture)  patch.plannedDeparture  = data.plannedDeparture.slice(0, 16);
        if (data.plannedReturn)     patch.plannedReturn     = data.plannedReturn.slice(0, 16);
        if (data.revenue)           patch.revenue           = data.revenue;
        
        let newNotes = this.form.get('notes')?.value || '';
        if (data.cargoDescription)  newNotes += `\nFret: ${data.cargoDescription}`;
        if (data.notes)             newNotes += `\n${data.notes}`;
        patch.notes = newNotes.trim();

        this.form.patchValue(patch);
        this.removeAiFile();
      },
      error: () => {
        this.aiLoading = false;
        this.snackBar.open('Erreur lors de l\'extraction', 'Fermer', { duration: 3000 });
      }
    });
  }
}