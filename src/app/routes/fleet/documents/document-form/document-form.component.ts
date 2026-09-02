import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, VehiculeResponse } from '../../fleet.service';
import { ChauffeurResponse } from '../../chauffeurs/chauffeur.model';
import { environment } from 'environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
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
    { value: 'PAYSLIP', label: 'Fiche de paie' },
    { value: 'OTHER', label: 'Autre (Vignette, etc.)' }
  ];
  vehicules: VehiculeResponse[] = [];
  partenaires: any[] = [];
  chauffeurs: ChauffeurResponse[] = [];

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingProofUrl: string | null = null;
  extracting = false;
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

    this.form.get('typeDocument')?.valueChanges.subscribe(type => {
      if (type === 'PAYSLIP') {
        const today = new Date().toISOString().split('T')[0];
        this.form.patchValue({
          entityType: 'DRIVER',
          issueDate: today
        });
      }
    });

    // entityId obligatoire seulement pour VEHICLE, DRIVER et PARTNER
    this.form.get('entityType')?.valueChanges.subscribe(type => {
      const entityIdCtrl = this.form.get('entityId');
      if (type === 'VEHICLE' || type === 'DRIVER' || type === 'PARTNER') {
        entityIdCtrl?.setValidators(Validators.required);
      } else {
        entityIdCtrl?.clearValidators();
        entityIdCtrl?.setValue(null);
      }
      entityIdCtrl?.updateValueAndValidity();
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
    this.fleetService.getChauffeurs().subscribe(res => this.chauffeurs = res.content ?? res);
    this.fleetService.getPartenaires().subscribe(res => this.partenaires = res.content ?? res);
  }

  get entityType(): string {
    return this.form.get('entityType')?.value;
  }

  isDragging = false;

  onFileChange(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Renommer le fichier collé (souvent 'image.png' par défaut)
          const newFile = new File([file], `document_colle_${new Date().getTime()}.png`, { type: file.type });
          this.handleFile(newFile);
          break;
        }
      }
    }
  }

  handleFile(file: File): void {
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

  extractData(): void {
    if (!this.selectedFile) return;
    this.extracting = true;
    this.fleetService.extractDocumentData(this.selectedFile).subscribe({
      next: (res: any) => {
        this.extracting = false;
        if (res) {
          const typeMap: Record<string, string> = {
            INSURANCE: 'INSURANCE',
            TECHNICAL_CONTROL: 'TECHNICAL_CONTROL',
            REGISTRATION: 'REGISTRATION',
            PERMIT: 'PERMIT',
            CONTRACT: 'CONTRACT',
            PAYSLIP: 'PAYSLIP',
            OTHER: 'OTHER',
          };
          const patch: any = {};
          if (res.typeDocument && typeMap[res.typeDocument]) {
            patch.typeDocument = typeMap[res.typeDocument];
          }
          if (res.referenceNumber) patch.referenceNumber = res.referenceNumber;
          if (res.issueDate) patch.issueDate = res.issueDate;
          if (res.expiryDate) patch.expiryDate = res.expiryDate;
          if (res.issuer) patch.issuer = res.issuer;
          if (res.amount != null) patch.amount = res.amount;
          if (res.notes) patch.notes = res.notes;
          this.form.patchValue(patch);
          this.snackBar.open('Données extraites avec succès', 'Fermer', { duration: 3000 });
        }
      },
      error: () => {
        this.extracting = false;
        this.snackBar.open('Erreur lors de l\'extraction IA', 'Fermer', { duration: 3000 });
      }
    });
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
