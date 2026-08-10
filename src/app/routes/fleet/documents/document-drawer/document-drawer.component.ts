import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from 'environments/environment';
import { FleetService, MachineResponse, VehiculeResponse } from 'fleet/fleet.service';
import { ChauffeurResponse } from 'fleet/chauffeurs/chauffeur.model';

@Component({
  selector: 'app-document-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './document-drawer.component.html',
  styleUrls: ['./document-drawer.component.scss'],
})
export class DocumentDrawerComponent implements OnChanges {
  @Input() open = false;
  @Input() chauffeurId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
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
  machines: MachineResponse[] = [];
  chauffeurs: ChauffeurResponse[] = [];

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingProofUrl: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private snackBar: MatSnackBar,
  ) {
    this.initForm();
    this.loadEntities();
  }

  private initForm(): void {
    this.form = this.fb.group({
      typeDocument: ['PAYSLIP', Validators.required],
      entityType: ['DRIVER', Validators.required],
      entityId: [null, Validators.required],
      referenceNumber: [''],
      issuer: [''],
      issueDate: [new Date().toISOString().split('T')[0]],
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
        }, { emitEvent: false });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.resetState();
      
      if (this.chauffeurId) {
        this.form.patchValue({
          typeDocument: 'PAYSLIP',
          entityType: 'DRIVER',
          entityId: this.chauffeurId,
          issueDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }

  private resetState(): void {
    this.submitted = false;
    this.loading = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.existingProofUrl = null;
    if (this.form) {
      this.form.reset({
        typeDocument: 'PAYSLIP',
        entityType: 'DRIVER',
        entityId: this.chauffeurId,
        issueDate: new Date().toISOString().split('T')[0],
        amount: 0,
        status: 'ACTIVE',
        notes: ''
      });
    }
  }

  loadEntities(): void {
    this.fleetService.getVehicules().subscribe((res:any) => this.vehicules = res.content ?? res);
    this.fleetService.getMachines().subscribe((res:any) => this.machines = res.content ?? res);
    this.fleetService.getChauffeurs().subscribe((res:any) => this.chauffeurs = res.content ?? res);
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

  close(): void {
    this.open = false;
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;

    this.fleetService.saveDocumentFlotte(this.form.value, this.selectedFile || undefined)
      .subscribe({
        next: () => {
          this.snackBar.open('Document enregistré avec succès', 'Fermer', { duration: 3000 });
          this.saved.emit();
          this.close();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
  }
}
