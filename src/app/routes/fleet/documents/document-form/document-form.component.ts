import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse, MachineResponse } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { environment } from 'environments/environments/environment';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule, MatIconModule],
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss'],
})
export class DocumentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  documentId?: number;
  loading = false;
  submitted = false;

  readonly typeDocuments = [
    { value: 'INSURANCE', label: 'Assurance' },
    { value: 'TECHNICAL_CONTROL', label: 'Visite Technique' },
    { value: 'REGISTRATION', label: 'Carte Grise' },
    { value: 'PERMIT', label: 'Permis / Autorisation' },
    { value: 'CONTRACT', label: 'Contrat' },
    { value: 'OTHER', label: 'Autre (Vignette, etc.)' }
  ];
  vehicules: VehiculeResponse[] = [];
  machines: MachineResponse[] = [];
  chauffeurs: ChauffeurResponse[] = [];

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingProofUrl: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
      this.form = this.fb.group({
      typeDocument: ['INSURANCE', Validators.required],
      entityType: ['VEHICLE', Validators.required],
      entityId: [null, Validators.required],
      referenceNumber: [''],
      issuer: [''],
      issueDate: [null],
      expiryDate: [null],
      amount: [0],
      status: ['ACTIVE'],
      notes: [''],
    });

    this.loadEntities();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.documentId = +id;

        this.fleetService.getDocumentFlotteById(this.documentId).subscribe({
          next: d => {
            this.form.patchValue(d);
            if (d.filePath) {
              // Assumer que fleetService.base pointe vers /api/v1/fleet
              this.existingProofUrl = `${environment.baseUrl}/fleet/documents/${this.documentId}/file`;
            }
          },
          error: () => this.snackBar.open('Erreur chargement', 'Fermer', { duration: 3000 })
        });
      }
    });
  }

  loadEntities(): void {
    this.fleetService.getVehicules().subscribe(res => this.vehicules = res.content ?? res);
    this.fleetService.getMachines().subscribe(res => this.machines = res.content ?? res);
    this.fleetService.getChauffeurs().subscribe(res => this.chauffeurs = res.content ?? res);
  }

  get entityType(): string {
    return this.form.get('entityType')?.value;
  }

  onFileChange(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile = file;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    const request$ = this.isEdit && this.documentId
      ? this.fleetService.saveDocumentFlotte(this.form.value, this.selectedFile || undefined, this.documentId)
      : this.fleetService.saveDocumentFlotte(this.form.value, this.selectedFile || undefined);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Document enregistré', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/documents']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/documents']);
  }
}
